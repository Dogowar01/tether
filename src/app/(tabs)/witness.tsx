import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
  return CRISIS_TERMS.some(t => text.toLowerCase().includes(t));
}

// ── Themes ─────────────────────────────────────────────────────────────────

interface Theme {
  id: string;
  label: string;
  desc: string;
  prompt: string;
  color: string;
}

const THEMES: Theme[] = [
  {
    id: 'unsent',
    label: 'Words unsent',
    desc: "For someone you can't or won't speak to",
    prompt: 'What I needed you to hear was...',
    color: '#C68B3A',
  },
  {
    id: 'carrying',
    label: 'Something heavy',
    desc: 'For whatever is weighing on you right now',
    prompt: "I've been carrying something. It feels like...",
    color: '#8ABDA8',
  },
  {
    id: 'grief',
    label: 'Grief',
    desc: 'For any kind of loss',
    prompt: 'What I miss most is...',
    color: '#8573C8',
  },
  {
    id: 'anger',
    label: 'Anger',
    desc: 'For things that need to be said out loud',
    prompt: "What I couldn't say was...",
    color: '#C38790',
  },
  {
    id: 'needed',
    label: 'What I needed',
    desc: 'For unmet needs or self-compassion',
    prompt: 'What I really needed was...',
    color: '#A09278',
  },
];

// ── Colours ────────────────────────────────────────────────────────────────

const acc = Accent.amber;

const PAGE_GRADIENT = [
  'rgba(200,120,72,0.35)',
  'rgba(200,120,72,0.08)',
  'rgba(26,24,32,0)',
] as const;

const BG = (
  <Image
    source={require('@/../assets/images/rainwater.png')}
    style={[StyleSheet.absoluteFill, { opacity: 0.20, transform: [{ translateX: -80 }] }]}
    resizeMode="cover"
  />
);

// ── Crisis card ────────────────────────────────────────────────────────────

function CrisisCard() {
  const { colors } = useTheme();
  return (
    <View style={[crisisStyles.card, { backgroundColor: colors.crisisBg, borderColor: colors.crisisBorder }]}>
      <Text style={[crisisStyles.heading, { color: colors.crisis }]}>Are you safe right now?</Text>
      <Text style={[crisisStyles.body, { color: colors.textSoft }]}>
        If you're in crisis, please reach out. You don't have to hold this alone.
      </Text>
      <View style={crisisStyles.lines}>
        <Text style={[crisisStyles.line, { color: colors.crisis }]}>🇦🇺 Lifeline Australia · 13 11 14</Text>
        <Text style={[crisisStyles.line, { color: colors.crisis }]}>🌐 Crisis Text Line · text HOME to 741741</Text>
        <Text style={[crisisStyles.line, { color: colors.crisis }]}>🇺🇸 988 Suicide & Crisis Lifeline · 988</Text>
      </View>
    </View>
  );
}

const crisisStyles = StyleSheet.create({
  card: { marginTop: Space.md, borderRadius: Radius.lg, borderWidth: 1, padding: Space.md },
  heading: { fontSize: 15, fontWeight: '600', marginBottom: Space.xs },
  body: { fontSize: 14, lineHeight: 20, marginBottom: Space.md, fontStyle: 'italic' },
  lines: { gap: Space.xs },
  line: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
});

// ── Types ──────────────────────────────────────────────────────────────────

interface Letter {
  id: string;
  text: string;
  date: string;
  themeLabel?: string;
  themeColor?: string;
}

type Feedback = 'held' | 'released' | null;
type ViewMode = 'theme' | 'write' | 'archive' | 'reading';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function preview(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function WitnessScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [view, setView]                   = useState<ViewMode>('theme');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [text, setText]                   = useState('');
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [feedback, setFeedback]           = useState<Feedback>(null);
  const [savedLetters, setSavedLetters]   = useState<Letter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const textOpacity = useSharedValue(1);
  const animatedTextStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  const hasText    = text.trim().length > 0;
  const showCrisis = isCrisis(text);

  useEffect(() => {
    AsyncStorage.getItem('witness_letters').then(stored => {
      if (stored) setSavedLetters(JSON.parse(stored));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (feedback === null) textOpacity.value = 1;
  }, [feedback]);

  // ── Theme selection ────────────────────────────────────────────────────

  function handleSelectTheme(theme: Theme) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    setSelectedTheme(theme);
    setConfirmRelease(false);
    setView('write');
  }

  function handleWriteFreely() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    setSelectedTheme(null);
    setConfirmRelease(false);
    setView('write');
  }

  // ── Hold ──────────────────────────────────────────────────────────────

  async function handleHold() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const letter: Letter = {
      id: `${Date.now()}`,
      text: text.trim(),
      date: new Date().toISOString(),
      themeLabel: selectedTheme?.label,
      themeColor: selectedTheme?.color,
    };
    const updated = [letter, ...savedLetters];
    setSavedLetters(updated);
    try { await AsyncStorage.setItem('witness_letters', JSON.stringify(updated)); } catch {}
    setText('');
    setConfirmRelease(false);
    setFeedback('held');
    setTimeout(() => { setFeedback(null); setView('theme'); }, 2200);
  }

  // ── Release ────────────────────────────────────────────────────────────

  function afterRelease() {
    setText('');
    setConfirmRelease(false);
    setFeedback('released');
    setTimeout(() => { setFeedback(null); setView('theme'); }, 2200);
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

  // ── Delete ────────────────────────────────────────────────────────────

  async function deleteLetter(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = savedLetters.filter(l => l.id !== id);
    setSavedLetters(updated);
    try { await AsyncStorage.setItem('witness_letters', JSON.stringify(updated)); } catch {}
    if (selectedLetter?.id === id) { setSelectedLetter(null); setView('archive'); }
  }

  // ── Shared background + gradient ──────────────────────────────────────

  const pageChrome = (
    <>
      {BG}
      <LinearGradient colors={PAGE_GRADIENT} style={styles.gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
    </>
  );

  // ── Shared header row ─────────────────────────────────────────────────

  function PageHeader({ showBack = false, onBack }: { showBack?: boolean; onBack?: () => void }) {
    return (
      <View style={[styles.header, { paddingTop: insets.top + Space.lg }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: '#FFFFFF', fontFamily: Font.serif }]}>The Witness</Text>
            <View style={[styles.rule, { backgroundColor: acc.base }]} />
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.72)' }]}>
              Say what needs saying.
            </Text>
          </View>

          {!showBack && (
            <Pressable
              onPress={() => setView('archive')}
              hitSlop={16}
              style={({ pressed }) => [styles.archiveBtn, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="archive-outline" size={20} color="rgba(255,255,255,0.6)" />
              {savedLetters.length > 0 && (
                <View style={[styles.badge, { backgroundColor: acc.base }]}>
                  <Text style={styles.badgeText}>{savedLetters.length}</Text>
                </View>
              )}
            </Pressable>
          )}

          {showBack && (
            <Pressable
              onPress={onBack}
              hitSlop={16}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingTop: Space.xs })}
            >
              <Ionicons name="arrow-back-outline" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // ── Archive view ──────────────────────────────────────────────────────

  if (view === 'archive') {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {pageChrome}
        <PageHeader showBack onBack={() => setView('theme')} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.archiveList} showsVerticalScrollIndicator={false}>
          {savedLetters.length === 0 ? (
            <Text style={[styles.emptyText, { color: 'rgba(255,255,255,0.55)' }]}>Nothing held yet.</Text>
          ) : (
            savedLetters.map(letter => (
              <Pressable
                key={letter.id}
                onPress={() => { setSelectedLetter(letter); setView('reading'); }}
                style={({ pressed }) => [styles.letterCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
              >
                <View style={styles.letterCardTop}>
                  <View style={styles.letterCardMeta}>
                    {letter.themeLabel && (
                      <View style={[styles.themePillSmall, { backgroundColor: (letter.themeColor ?? acc.base) + '25', borderColor: (letter.themeColor ?? acc.base) + '50' }]}>
                        <Text style={[styles.themePillSmallLabel, { color: letter.themeColor ?? acc.base }]}>{letter.themeLabel}</Text>
                      </View>
                    )}
                    <Text style={[styles.letterDate, { color: 'rgba(255,255,255,0.5)' }]}>{formatDate(letter.date)}</Text>
                  </View>
                  <Pressable onPress={() => deleteLetter(letter.id)} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7 })}>
                    <Ionicons name="trash-outline" size={16} color={colors.muted} />
                  </Pressable>
                </View>
                <Text style={[styles.letterPreview, { color: colors.textSoft }]}>{preview(letter.text)}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
        <View style={{ height: insets.bottom || Space.md }} />
      </View>
    );
  }

  // ── Reading view ──────────────────────────────────────────────────────

  if (view === 'reading' && selectedLetter) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {pageChrome}
        <PageHeader showBack onBack={() => { setSelectedLetter(null); setView('archive'); }} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.readingScroll, { paddingHorizontal: Space.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {selectedLetter.themeLabel && (
            <View style={[styles.themePillSmall, { backgroundColor: (selectedLetter.themeColor ?? acc.base) + '25', borderColor: (selectedLetter.themeColor ?? acc.base) + '50', marginBottom: Space.md }]}>
              <Text style={[styles.themePillSmallLabel, { color: selectedLetter.themeColor ?? acc.base }]}>{selectedLetter.themeLabel}</Text>
            </View>
          )}
          <Text style={[styles.readingDate, { color: 'rgba(255,255,255,0.45)' }]}>{formatDate(selectedLetter.date)}</Text>
          <Text style={[styles.readingText, { color: '#FFFFFF', fontFamily: Font.serifItalic }]}>{selectedLetter.text}</Text>
          <Pressable
            onPress={() => deleteLetter(selectedLetter.id)}
            style={({ pressed }) => [styles.deleteBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="trash-outline" size={15} color={colors.muted} />
            <Text style={[styles.deleteBtnLabel, { color: colors.muted }]}>Delete this letter</Text>
          </Pressable>
        </ScrollView>
        <View style={{ height: insets.bottom || Space.md }} />
      </View>
    );
  }

  // ── Write view ────────────────────────────────────────────────────────

  if (view === 'write') {
    const showButtons = (hasText || confirmRelease) && !feedback;
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {pageChrome}
        <PageHeader showBack onBack={() => setView('theme')} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scroll, { paddingHorizontal: Space.xl }]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            {/* Theme pill */}
            {selectedTheme && (
              <Pressable
                onPress={() => setView('theme')}
                style={[styles.themePill, { backgroundColor: selectedTheme.color + '22', borderColor: selectedTheme.color + '55' }]}
              >
                <Text style={[styles.themePillLabel, { color: selectedTheme.color }]}>{selectedTheme.label}</Text>
                <Ionicons name="close" size={13} color={selectedTheme.color} />
              </Pressable>
            )}

            {/* Prompt */}
            {selectedTheme && (
              <Text style={[styles.prompt, { color: 'rgba(255,255,255,0.58)', fontFamily: Font.serifItalic }]}>
                {selectedTheme.prompt}
              </Text>
            )}

            {/* Input */}
            <Animated.View style={animatedTextStyle}>
              <TextInput
                style={[styles.input, { color: '#FFFFFF', fontFamily: Font.serifItalic }]}
                placeholder={selectedTheme ? 'Keep writing...' : 'Say what needs saying...'}
                placeholderTextColor="rgba(255,255,255,0.38)"
                value={text}
                onChangeText={t => { setText(t); if (confirmRelease) setConfirmRelease(false); }}
                multiline
                textAlignVertical="top"
                autoCorrect
                autoCapitalize="sentences"
                autoFocus
              />
            </Animated.View>

            {showCrisis && <CrisisCard />}
          </ScrollView>

          {feedback && (
            <View style={[styles.feedbackBar, { backgroundColor: acc.bgD }]}>
              <Ionicons name={feedback === 'held' ? 'bookmark' : 'leaf'} size={16} color={acc.btn} style={{ marginRight: Space.xs }} />
              <Text style={[styles.feedbackText, { color: acc.text.dark }]}>
                {feedback === 'held' ? 'Held safely.' : 'Let go.'}
              </Text>
            </View>
          )}

          {showButtons && (
            <View style={[styles.actions, { borderTopColor: colors.borderSoft, backgroundColor: colors.bg }]}>
              {confirmRelease ? (
                <>
                  <Pressable onPress={() => setConfirmRelease(false)} style={({ pressed }) => [styles.btn, styles.btnGhost, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}>
                    <Text style={[styles.btnLabel, { color: colors.muted }]}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleReleasePress} style={({ pressed }) => [styles.btn, { backgroundColor: acc.base, opacity: pressed ? 0.8 : 1 }]}>
                    <Ionicons name="leaf-outline" size={16} color="#fff" />
                    <Text style={[styles.btnLabel, { color: '#fff' }]}>Let it go</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable onPress={handleHold} style={({ pressed }) => [styles.btn, styles.btnGhost, { borderColor: acc.ring, opacity: pressed ? 0.6 : 1 }]}>
                    <Ionicons name="bookmark-outline" size={16} color={acc.base} />
                    <Text style={[styles.btnLabel, { color: acc.base }]}>Hold</Text>
                  </Pressable>
                  <Pressable onPress={handleReleasePress} style={({ pressed }) => [styles.btn, { backgroundColor: acc.btn, opacity: pressed ? 0.8 : 1 }]}>
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

  // ── Theme selection view (default) ────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {pageChrome}
      <PageHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.themeScroll, { paddingHorizontal: Space.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.themeQuestion, { color: 'rgba(255,255,255,0.80)', fontFamily: Font.serifItalic }]}>
          What are you carrying right now?
        </Text>

        <View style={styles.themeList}>
          {THEMES.map(theme => (
            <Pressable
              key={theme.id}
              onPress={() => handleSelectTheme(theme)}
              style={({ pressed }) => [
                styles.themeCard,
                {
                  backgroundColor: theme.color + '18',
                  borderColor: theme.color + '35',
                  borderLeftColor: theme.color,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[styles.themeCardLabel, { color: '#FFFFFF', fontFamily: Font.serif }]}>
                {theme.label}
              </Text>
              <Text style={[styles.themeCardDesc, { color: 'rgba(255,255,255,0.60)' }]}>
                {theme.desc}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleWriteFreely}
          style={({ pressed }) => [styles.freeWriteBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.freeWriteLabel, { color: 'rgba(255,255,255,0.40)' }]}>
            or write without a prompt
          </Text>
          <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.40)" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  gradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 220,
  },

  // Header
  header: { paddingHorizontal: Space.xl, paddingBottom: Space.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 40, marginBottom: Space.sm },
  rule: { width: 36, height: 2, borderRadius: 1, marginBottom: Space.sm },
  subtitle: { fontSize: 15, fontStyle: 'italic' },
  archiveBtn: { paddingTop: Space.xs, alignItems: 'center' },
  badge: {
    position: 'absolute', top: 0, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Theme selection
  themeScroll: { paddingBottom: Space.xl + 24 },
  themeQuestion: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: Space.xl,
  },
  themeList: { gap: 10, marginBottom: Space.xl },
  themeCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingVertical: Space.md,
    paddingHorizontal: Space.md,
    gap: 4,
  },
  themeCardLabel: { fontSize: 17, lineHeight: 22 },
  themeCardDesc: { fontSize: 13, lineHeight: 19 },
  freeWriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Space.md,
  },
  freeWriteLabel: { fontSize: 14, fontStyle: 'italic' },

  // Write view
  scroll: { flexGrow: 1, paddingTop: Space.sm, paddingBottom: Space.xl },
  themePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.round,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: Space.md,
  },
  themePillLabel: { fontSize: 13, fontWeight: '600' },
  prompt: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: Space.lg,
  },
  input: {
    fontSize: 18,
    lineHeight: 30,
    minHeight: 200,
    textAlignVertical: 'top',
  },

  // Feedback
  feedbackBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Space.md, marginHorizontal: Space.xl, marginBottom: Space.sm, borderRadius: Radius.md,
  },
  feedbackText: { fontSize: 15, fontStyle: 'italic' },

  // Action buttons
  actions: {
    flexDirection: 'row', gap: Space.sm,
    paddingHorizontal: Space.xl, paddingTop: Space.md, paddingBottom: Space.sm, borderTopWidth: 1,
  },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Space.xs, paddingVertical: Space.md - 2, borderRadius: Radius.md,
  },
  btnGhost: { borderWidth: 1, backgroundColor: 'transparent' },
  btnLabel: { fontSize: 15, fontWeight: '600' },

  // Archive
  archiveList: { paddingHorizontal: Space.xl, paddingTop: Space.sm, paddingBottom: Space.xl, gap: Space.sm },
  emptyText: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', marginTop: Space.xxl },
  letterCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Space.md, gap: Space.xs },
  letterCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  letterCardMeta: { gap: 4, flex: 1 },
  letterDate: { fontSize: 12, letterSpacing: 0.2 },
  letterPreview: { fontSize: 14, lineHeight: 21 },

  // Theme pill (small — used in archive + reading)
  themePillSmall: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.round,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  themePillSmallLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  // Reading
  readingScroll: { flexGrow: 1, paddingTop: Space.sm, paddingBottom: Space.xl },
  readingDate: { fontSize: 12, letterSpacing: 0.3, marginBottom: Space.lg },
  readingText: { fontSize: 18, lineHeight: 30, marginBottom: Space.xxl },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Space.xs, paddingVertical: Space.sm + 2, borderRadius: Radius.md, borderWidth: 1,
  },
  deleteBtnLabel: { fontSize: 14 },
});
