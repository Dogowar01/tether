import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accent, Font, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ── Crisis detection ───────────────────────────────────────────────────────

const CRISIS_TERMS = [
  'suicide', 'kill myself', 'end my life', 'self-harm', 'self harm',
  'hurt myself', "don't want to be here", 'want to die', 'not worth living',
  'no reason to live', 'better off dead',
];

function isCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_TERMS.some(t => lower.includes(t));
}

// ── Colours ────────────────────────────────────────────────────────────────

const acc = Accent.amber;

const PAGE_GRADIENT = [
  'rgba(200,120,72,0.35)',
  'rgba(200,120,72,0.08)',
  'rgba(26,24,32,0)',
] as const;

// ── Crisis card ────────────────────────────────────────────────────────────

function CrisisCard() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        crisisStyles.card,
        { backgroundColor: colors.crisisBg, borderColor: colors.crisisBorder },
      ]}
    >
      <Text style={[crisisStyles.heading, { color: colors.crisis }]}>
        Are you safe right now?
      </Text>
      <Text style={[crisisStyles.body, { color: colors.textSoft }]}>
        If you're in crisis, please reach out. You don't have to hold this alone.
      </Text>
      <View style={crisisStyles.lines}>
        <Text style={[crisisStyles.line, { color: colors.crisis }]}>
          🇦🇺 Lifeline Australia · 13 11 14
        </Text>
        <Text style={[crisisStyles.line, { color: colors.crisis }]}>
          🌐 Crisis Text Line · text HOME to 741741
        </Text>
        <Text style={[crisisStyles.line, { color: colors.crisis }]}>
          🇺🇸 988 Suicide & Crisis Lifeline · 988
        </Text>
      </View>
    </View>
  );
}

const crisisStyles = StyleSheet.create({
  card: {
    marginTop: Space.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Space.md,
  },
  heading: { fontSize: 15, fontWeight: '600', marginBottom: Space.xs },
  body: { fontSize: 14, lineHeight: 20, marginBottom: Space.md, fontStyle: 'italic' },
  lines: { gap: Space.xs },
  line: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
});

// ── Types ─────────────────────────────────────────────────────────────────

interface Letter {
  id: string;
  text: string;
  date: string;
}

type Feedback = 'held' | 'released' | null;
type View = 'write' | 'archive' | 'reading';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function preview(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function WitnessScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Write state
  const [text, setText] = useState('');
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Archive state
  const [view, setView] = useState<View>('write');
  const [savedLetters, setSavedLetters] = useState<Letter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const textOpacity = useSharedValue(1);
  const animatedTextStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  const hasText = text.trim().length > 0;
  const showCrisis = isCrisis(text);

  // ── Load letters on mount ──────────────────────────────────────────────

  useEffect(() => {
    AsyncStorage.getItem('witness_letters').then(stored => {
      if (stored) setSavedLetters(JSON.parse(stored));
    }).catch(() => {});
  }, []);

  // ── Hold: save privately ───────────────────────────────────────────────

  async function handleHold() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const letter: Letter = {
      id: `${Date.now()}`,
      text: text.trim(),
      date: new Date().toISOString(),
    };
    const updated = [letter, ...savedLetters];
    setSavedLetters(updated);
    try {
      await AsyncStorage.setItem('witness_letters', JSON.stringify(updated));
    } catch { /* silent */ }

    setText('');
    setConfirmRelease(false);
    setFeedback('held');
    setTimeout(() => setFeedback(null), 2200);
  }

  // ── Delete a held letter ───────────────────────────────────────────────

  async function deleteLetter(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = savedLetters.filter(l => l.id !== id);
    setSavedLetters(updated);
    try {
      await AsyncStorage.setItem('witness_letters', JSON.stringify(updated));
    } catch { /* silent */ }
    // If reading the deleted letter, go back to list
    if (selectedLetter?.id === id) {
      setSelectedLetter(null);
      setView('archive');
    }
  }

  // ── Release: let it go ─────────────────────────────────────────────────

  useEffect(() => {
    if (feedback === null) textOpacity.value = 1;
  }, [feedback]);

  function afterRelease() {
    setText('');
    setConfirmRelease(false);
    setFeedback('released');
    setTimeout(() => setFeedback(null), 2200);
  }

  function handleReleasePress() {
    if (!confirmRelease) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConfirmRelease(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    textOpacity.value = withTiming(0, { duration: 1200 }, finished => {
      if (finished) runOnJS(afterRelease)();
    });
  }

  // ── Shared header ──────────────────────────────────────────────────────

  function Header({ showBack = false }: { showBack?: boolean }) {
    return (
      <View style={[styles.header, { paddingTop: insets.top + Space.lg }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: '#FFFFFF', fontFamily: Font.serif }]}>
              The Witness
            </Text>
            <View style={[styles.rule, { backgroundColor: acc.base }]} />
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.72)' }]}>
              Be heard without judgment.
            </Text>
          </View>

          {/* Archive icon — only on write view */}
          {!showBack && (
            <Pressable
              onPress={() => setView('archive')}
              hitSlop={16}
              style={({ pressed }) => [styles.archiveBtn, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="archive-outline" size={20} color={colors.dim} />
              {savedLetters.length > 0 && (
                <View style={[styles.badge, { backgroundColor: acc.base }]}>
                  <Text style={styles.badgeText}>{savedLetters.length}</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Back arrow — archive / reading views */}
          {showBack && (
            <Pressable
              onPress={() => {
                if (view === 'reading') { setSelectedLetter(null); setView('archive'); }
                else { setView('write'); }
              }}
              hitSlop={16}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingTop: Space.xs })}
            >
              <Ionicons name="arrow-back-outline" size={22} color={colors.dim} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // ── Archive list view ──────────────────────────────────────────────────

  if (view === 'archive') {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Image source={require('@/../assets/images/rainwater.png')} style={[StyleSheet.absoluteFill, { opacity: 0.20, transform: [{ translateX: -80 }] }]} resizeMode="cover" />
      <LinearGradient colors={PAGE_GRADIENT} style={styles.gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
        <Header showBack />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.archiveList}
          showsVerticalScrollIndicator={false}
        >
          {savedLetters.length === 0 ? (
            <Text style={[styles.emptyText, { color: 'rgba(255,255,255,0.55)' }]}>
              Nothing held yet.
            </Text>
          ) : (
            savedLetters.map(letter => (
              <Pressable
                key={letter.id}
                onPress={() => { setSelectedLetter(letter); setView('reading'); }}
                style={({ pressed }) => [
                  styles.letterCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={styles.letterCardTop}>
                  <Text style={[styles.letterDate, { color: acc.base }]}>
                    {formatDate(letter.date)}
                  </Text>
                  <Pressable
                    onPress={() => deleteLetter(letter.id)}
                    hitSlop={12}
                    style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7 })}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.muted} />
                  </Pressable>
                </View>
                <Text style={[styles.letterPreview, { color: colors.textSoft }]}>
                  {preview(letter.text)}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
        <View style={{ height: insets.bottom || Space.md }} />
      </View>
    );
  }

  // ── Full letter reading view ───────────────────────────────────────────

  if (view === 'reading' && selectedLetter) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Image source={require('@/../assets/images/rainwater.png')} style={[StyleSheet.absoluteFill, { opacity: 0.20, transform: [{ translateX: -80 }] }]} resizeMode="cover" />
      <LinearGradient colors={PAGE_GRADIENT} style={styles.gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
        <Header showBack />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.readingScroll, { paddingHorizontal: Space.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.readingDate, { color: acc.base }]}>
            {formatDate(selectedLetter.date)}
          </Text>
          <Text style={[styles.readingText, { color: '#FFFFFF', fontFamily: Font.serifItalic }]}>
            {selectedLetter.text}
          </Text>

          <Pressable
            onPress={() => deleteLetter(selectedLetter.id)}
            style={({ pressed }) => [
              styles.deleteBtn,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={15} color={colors.muted} />
            <Text style={[styles.deleteBtnLabel, { color: colors.muted }]}>
              Delete this letter
            </Text>
          </Pressable>
        </ScrollView>
        <View style={{ height: insets.bottom || Space.md }} />
      </View>
    );
  }

  // ── Write view ─────────────────────────────────────────────────────────

  const showButtons = (hasText || confirmRelease) && !feedback;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Image source={require('@/../assets/images/rainwater.png')} style={[StyleSheet.absoluteFill, { opacity: 0.20, transform: [{ translateX: -80 }] }]} resizeMode="cover" />
      <LinearGradient colors={PAGE_GRADIENT} style={styles.gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <Header />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: Space.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <Text style={[styles.instruction, { color: 'rgba(255,255,255,0.65)' }]}>
            Write to whoever needs to hear this.
          </Text>

          <Animated.View style={animatedTextStyle}>
            <TextInput
              style={[styles.input, { color: '#FFFFFF', fontFamily: Font.serifItalic }]}
              placeholder="Say what needs saying..."
              placeholderTextColor={'rgba(255,255,255,0.45)'}
              value={text}
              onChangeText={t => {
                setText(t);
                if (confirmRelease) setConfirmRelease(false);
              }}
              multiline
              textAlignVertical="top"
              autoCorrect
              autoCapitalize="sentences"
            />
          </Animated.View>

          {showCrisis && <CrisisCard />}
        </ScrollView>

        {feedback && (
          <View style={[styles.feedbackBar, { backgroundColor: acc.bgD }]}>
            <Ionicons
              name={feedback === 'held' ? 'bookmark' : 'leaf'}
              size={16}
              color={acc.btn}
              style={{ marginRight: Space.xs }}
            />
            <Text style={[styles.feedbackText, { color: acc.text.dark }]}>
              {feedback === 'held' ? 'Held safely.' : 'Let go.'}
            </Text>
          </View>
        )}

        {showButtons && (
          <View style={[styles.actions, { borderTopColor: colors.borderSoft, backgroundColor: colors.bg }]}>
            {confirmRelease ? (
              <>
                <Pressable
                  onPress={() => setConfirmRelease(false)}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
                >
                  <Text style={[styles.btnLabel, { color: colors.muted }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleReleasePress}
                  style={({ pressed }) => [styles.btn, { backgroundColor: acc.base, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="leaf-outline" size={16} color="#fff" />
                  <Text style={[styles.btnLabel, { color: '#fff' }]}>Let it go</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={handleHold}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, { borderColor: acc.ring, opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="bookmark-outline" size={16} color={acc.base} />
                  <Text style={[styles.btnLabel, { color: acc.base }]}>Hold</Text>
                </Pressable>
                <Pressable
                  onPress={handleReleasePress}
                  style={({ pressed }) => [styles.btn, { backgroundColor: acc.btn, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="leaf-outline" size={16} color="#fff" />
                  <Text style={[styles.btnLabel, { color: '#fff' }]}>Release</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <View style={{ height: insets.bottom || Space.md }} />
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },

  header: {
    paddingHorizontal: Space.xl,
    paddingBottom: Space.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 40,
    marginBottom: Space.sm,
  },
  rule: {
    width: 36,
    height: 2,
    borderRadius: 1,
    marginBottom: Space.sm,
  },
  subtitle: {
    fontSize: 15,
    fontStyle: 'italic',
  },

  scroll: {
    flexGrow: 1,
    paddingTop: Space.sm,
    paddingBottom: Space.xl,
  },

  instruction: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: Space.lg,
    lineHeight: 20,
  },

  input: {
    fontSize: 18,
    lineHeight: 30,
    minHeight: 220,
    textAlignVertical: 'top',
  },

  // Feedback
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Space.md,
    marginHorizontal: Space.xl,
    marginBottom: Space.sm,
    borderRadius: Radius.md,
  },
  feedbackText: {
    fontSize: 15,
    fontStyle: 'italic',
  },

  // Buttons
  actions: {
    flexDirection: 'row',
    gap: Space.sm,
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
    paddingVertical: Space.md - 2,
    borderRadius: Radius.md,
  },
  btnGhost: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Archive icon + badge
  archiveBtn: {
    paddingTop: Space.xs,
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Archive list
  archiveList: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.sm,
    paddingBottom: Space.xl,
    gap: Space.sm,
  },
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Space.xxl,
  },
  letterCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Space.md,
    gap: Space.xs,
  },
  letterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  letterDate: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  letterPreview: {
    fontSize: 14,
    lineHeight: 21,
  },

  // Reading view
  readingScroll: {
    flexGrow: 1,
    paddingTop: Space.sm,
    paddingBottom: Space.xl,
  },
  readingDate: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: Space.lg,
  },
  readingText: {
    fontSize: 18,
    lineHeight: 30,
    marginBottom: Space.xxl,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
    paddingVertical: Space.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  deleteBtnLabel: {
    fontSize: 14,
  },
});
