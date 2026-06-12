import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VESSELS, Vessel } from '@/constants/data';
import { Accent, Font, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ViewMode = 'write' | 'vessel' | 'seal' | 'archive' | 'reading';

interface ContainerEntry {
  id: string;
  content: string;
  vesselId: string;
  date: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function previewText(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

const acc = Accent.slate;

// ── Vessel config ─────────────────────────────────────────────────────────

const VESSEL_META: Record<string, { icon: string; desc: string; color: string }> = {
  chest:  { icon: 'cube-outline',        desc: 'Holds things with a heavy lid',          color: '#C89040' },
  jar:    { icon: 'flask-outline',        desc: 'Sealed, but still visible',              color: '#52B8B0' },
  cave:   { icon: 'aperture-outline',     desc: 'Still and deep underground',             color: '#7888A8' },
  ocean:  { icon: 'water-outline',        desc: 'Vast enough to hold anything',           color: '#4878C8' },
  vault:  { icon: 'lock-closed-outline',  desc: 'No one enters without your permission',  color: '#90A0B8' },
  river:  { icon: 'git-branch-outline',    desc: 'Carries it gently downstream',           color: '#38B8C8' },
};

// ── Page gradient (violet wash) ───────────────────────────────────────────

const PAGE_GRADIENT = [
  'rgba(120,100,168,0.45)',
  'rgba(120,100,168,0.12)',
  'rgba(26,24,32,0)',
] as const;

const CARD_BG    = 'rgba(22,18,40,0.85)';
const CARD_BORDER = 'rgba(120,100,168,0.22)';

// ── Write view ────────────────────────────────────────────────────────────

function WriteView({ onNext, content, setContent, onOpenArchive, archiveCount }: {
  onNext: () => void;
  content: string;
  setContent: (s: string) => void;
  onOpenArchive: () => void;
  archiveCount: number;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const headerOpacity = useSharedValue(0);
  const headerY       = useSharedValue(-14);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 480 });
    headerY.value       = withSpring(0, { damping: 24, stiffness: 140 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.writeScroll, { paddingTop: insets.top + Space.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header row: title block + archive icon */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.text, fontFamily: Font.serif }]}>
                Container
              </Text>
              <View style={[styles.rule, { backgroundColor: acc.base }]} />
              <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
                What would you like to set down?
              </Text>
              <Text style={[styles.pageDesc, { color: colors.dim }]}>
                You don’t need to solve this right now. Write it here, choose somewhere to hold it, and set it down safely.
              </Text>
            </View>
            {archiveCount > 0 && (
              <Pressable
                onPress={onOpenArchive}
                hitSlop={16}
                style={({ pressed }) => [styles.archiveBtn, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Ionicons name="archive-outline" size={20} color={colors.dim} />
                <View style={[styles.badge, { backgroundColor: acc.base }]}>
                  <Text style={styles.badgeText}>{archiveCount}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Text area */}
        <Pressable
          style={[styles.inputWrapper, { borderColor: CARD_BORDER, backgroundColor: CARD_BG }]}
          onPress={() => inputRef.current?.focus()}
        >
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.text }]}
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="Write whatever needs to be set down — a feeling, a thought, something you can't stop turning over…"
            placeholderTextColor={colors.dim}
            textAlignVertical="top"
          />
        </Pressable>

        {/* CTA */}
        <Pressable
          onPress={() => {
            if (content.trim().length === 0) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
          style={[
            styles.ctaBtn,
            { backgroundColor: content.trim().length > 0 ? acc.base : acc.base + '55' },
          ]}
        >
          <Text style={styles.ctaBtnText}>Choose where to place this</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Vessel card ───────────────────────────────────────────────────────────

function VesselCard({ vessel, index, onPress }: {
  vessel: Vessel; index: number; onPress: () => void;
}) {
  const { colors } = useTheme();
  const meta = VESSEL_META[vessel.id];
  const scale     = useSharedValue(1);
  const opacity   = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value    = withDelay(index * 70 + 80, withTiming(1, { duration: 320 }));
    translateY.value = withDelay(index * 70 + 80, withSpring(0, { damping: 22, stiffness: 180 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const c = meta.color;

  return (
    <Animated.View style={[styles.vesselCardWrap, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 22, stiffness: 400 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => scale.value = withSpring(1, { damping: 16, stiffness: 300 })}
        style={{ borderRadius: Radius.lg }}
      >
        <LinearGradient
          colors={[c + '50', c + '10'] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.vesselCard, { borderColor: c + '55' }]}
        >
          <View style={[styles.vesselIconBadge, { backgroundColor: c + '25', borderColor: c + '50' }]}>
            <Ionicons name={meta.icon as any} size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.vesselLabel, { color: colors.text, fontFamily: Font.serif }]}>
            {vessel.label}
          </Text>
          <Text style={[styles.vesselDesc, { color: colors.dim }]}>{meta.desc}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Vessel view ───────────────────────────────────────────────────────────

function VesselView({ content, onBack, onSelect }: {
  content: string; onBack: () => void; onSelect: (v: Vessel) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const preview = content.length > 72 ? content.slice(0, 72).trimEnd() + '…' : content;

  return (
    <ScrollView
      contentContainerStyle={[styles.vesselScroll, { paddingTop: insets.top + Space.sm }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={20} color={colors.dim} />
        <Text style={[styles.backText, { color: colors.dim }]}>Container</Text>
      </Pressable>

      <View style={styles.vesselHeader}>
        <Text style={[styles.vesselTitle, { color: colors.text, fontFamily: Font.serif }]}>
          Where would you like to place it?
        </Text>
        <View style={[styles.previewBubble, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}>
          <Text style={[styles.previewText, { color: colors.muted }]} numberOfLines={3}>
            {preview}
          </Text>
        </View>
      </View>

      <View style={styles.vesselGrid}>
        {VESSELS.map((v, i) => (
          <VesselCard
            key={v.id}
            vessel={v}
            index={i}
            onPress={() => onSelect(v)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ── Seal animation ────────────────────────────────────────────────────────

// Three concentric rings expand outward and fade, coloured per vessel
function RingAnim({ color, size }: { color: string; size: number }) {
  const area = size + 40;
  const r1s = useSharedValue(1); const r1o = useSharedValue(0);
  const r2s = useSharedValue(1); const r2o = useSharedValue(0);
  const r3s = useSharedValue(1); const r3o = useSharedValue(0);

  useEffect(() => {
    const pulse = (s: any, o: any, delay: number) => {
      s.value = withDelay(delay, withRepeat(
        withSequence(withTiming(1, { duration: 0 }), withTiming(2.8, { duration: 2600 })),
        -1, false));
      o.value = withDelay(delay, withRepeat(
        withSequence(withTiming(0.55, { duration: 120 }), withTiming(0, { duration: 2480 })),
        -1, false));
    };
    pulse(r1s, r1o, 0);
    pulse(r2s, r2o, 867);
    pulse(r3s, r3o, 1734);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ scale: r1s.value }], opacity: r1o.value }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scale: r2s.value }], opacity: r2o.value }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ scale: r3s.value }], opacity: r3o.value }));

  const ring = { position: 'absolute' as const, width: area, height: area, borderRadius: area / 2, borderWidth: 1.5, borderColor: color };
  return <>
    <Animated.View style={[ring, s1]} />
    <Animated.View style={[ring, s2]} />
    <Animated.View style={[ring, s3]} />
  </>;
}

function SealAnimation({ color, size }: { vesselId: string; color: string; size: number }) {
  return <RingAnim color={color} size={size} />;
}

// ── Seal view ─────────────────────────────────────────────────────────────

function SealView({ vessel, onDone }: { vessel: Vessel; onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const iconSize = Math.min(W * 0.30, 120);
  const meta = VESSEL_META[vessel.id];
  const c = meta.color;

  // Icon
  const iconScale   = useSharedValue(0.5);
  const iconOpacity = useSharedValue(0);

  // Text
  const textOpacity = useSharedValue(0);
  const subOpacity  = useSharedValue(0);
  const btnOpacity  = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Vessel icon appears
    iconScale.value   = withSpring(1, { damping: 16, stiffness: 160 });
    iconOpacity.value = withTiming(1, { duration: 600 });

    // Text sequence
    textOpacity.value = withDelay(800,  withTiming(1, { duration: 600 }));
    subOpacity.value  = withDelay(1300, withTiming(1, { duration: 600 }));
    btnOpacity.value  = withDelay(2000, withTiming(1, { duration: 500 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }], opacity: iconOpacity.value }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const subStyle  = useAnimatedStyle(() => ({ opacity: subOpacity.value }));
  const btnStyle  = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <View style={[styles.sealRoot, {
      paddingTop: insets.top + Space.lg,
      paddingBottom: insets.bottom + Space.xl,
    }]}>
      {/* Vessel + vessel-specific animation */}
      <View style={[styles.sealCircleArea, { width: iconSize + 40, height: iconSize + 40 }]}>
        <SealAnimation vesselId={vessel.id} color={c} size={iconSize} />

        <Animated.View style={[styles.sealIconBadge, {
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize / 2,
          backgroundColor: c + '28',
          borderColor: c + '70',
        }, iconStyle]}>
          <Ionicons name={meta.icon as any} size={iconSize * 0.42} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Label */}
      <Text style={[styles.sealVesselName, { color: c }]}>{vessel.label}</Text>

      {/* Sealed text */}
      <Animated.Text style={[styles.sealTitle, { color: colors.text, fontFamily: Font.serif }, textStyle]}>
        Set down.
      </Animated.Text>
      <Animated.Text style={[styles.sealSub, { color: colors.muted }, subStyle]}>
        Your thoughts are held safely here.{'\n'}You can return to them when you’re ready.
      </Animated.Text>

      {/* Done button */}
      <Animated.View style={btnStyle}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onDone(); }}
          style={[styles.doneBtn, { borderColor: c + '60' }]}
        >
          <Text style={[styles.doneBtnText, { color: c }]}>Return</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Archive list view ─────────────────────────────────────────────────────

function ArchiveView({ entries, onBack, onDelete, onSelect }: {
  entries: ContainerEntry[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onSelect: (entry: ContainerEntry) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.archiveScroll, { paddingTop: insets.top + Space.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.archiveHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: colors.text, fontFamily: Font.serif }]}>
            Container
          </Text>
          <View style={[styles.rule, { backgroundColor: acc.base }]} />
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
            What’s been set down.
          </Text>
        </View>
        <Pressable
          onPress={onBack}
          hitSlop={16}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingTop: Space.xs })}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.dim} />
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.dim }]}>Nothing set down yet.</Text>
      ) : (
        <View style={styles.archiveList}>
          {entries.map(entry => {
            const meta = VESSEL_META[entry.vesselId];
            const vessel = VESSELS.find(v => v.id === entry.vesselId);
            if (!meta || !vessel) return null;
            return (
              <Pressable
                key={entry.id}
                onPress={() => onSelect(entry)}
                style={({ pressed }) => [
                  styles.archiveCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
              >
                {/* Vessel badge + info row */}
                <View style={styles.archiveCardTop}>
                  <View style={[styles.archiveVesselBadge, { backgroundColor: meta.color + '25', borderColor: meta.color + '55' }]}>
                    <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                  </View>
                  <Text style={[styles.archiveVesselName, { color: meta.color }]}>
                    {vessel.label}
                  </Text>
                  <Text style={[styles.archiveDate, { color: colors.dim }]}>
                    {formatDate(entry.date)}
                  </Text>
                  <Pressable
                    onPress={() => onDelete(entry.id)}
                    hitSlop={12}
                    style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7, marginLeft: Space.xs })}
                  >
                    <Ionicons name="trash-outline" size={15} color={colors.muted} />
                  </Pressable>
                </View>
                {/* Preview */}
                <Text style={[styles.archivePreview, { color: colors.textSoft }]}>
                  {previewText(entry.content)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ── Reading view ──────────────────────────────────────────────────────────

function ReadingView({ entry, onBack, onDelete }: {
  entry: ContainerEntry;
  onBack: () => void;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const meta = VESSEL_META[entry.vesselId];
  const vessel = VESSELS.find(v => v.id === entry.vesselId);

  return (
    <ScrollView
      contentContainerStyle={[styles.readingScroll, { paddingTop: insets.top + Space.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.archiveHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: colors.text, fontFamily: Font.serif }]}>
            Container
          </Text>
          <View style={[styles.rule, { backgroundColor: acc.base }]} />
        </View>
        <Pressable
          onPress={onBack}
          hitSlop={16}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingTop: Space.xs })}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.dim} />
        </Pressable>
      </View>

      {/* Vessel tag */}
      {meta && vessel && (
        <View style={[styles.readingVesselTag, { backgroundColor: meta.color + '20', borderColor: meta.color + '50' }]}>
          <Ionicons name={meta.icon as any} size={15} color={meta.color} />
          <Text style={[styles.readingVesselLabel, { color: meta.color }]}>{vessel.label}</Text>
        </View>
      )}

      {/* Date */}
      <Text style={[styles.readingDate, { color: colors.dim }]}>
        {formatDate(entry.date)}
      </Text>

      {/* Full content */}
      <Text style={[styles.readingContent, { color: colors.text, fontFamily: Font.serifItalic }]}>
        {entry.content}
      </Text>

      {/* Delete */}
      <Pressable
        onPress={() => onDelete(entry.id)}
        style={({ pressed }) => [
          styles.deleteBtn,
          { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Ionicons name="trash-outline" size={15} color={colors.muted} />
        <Text style={[styles.deleteBtnLabel, { color: colors.muted }]}>Delete this entry</Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function ContainerScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [view, setView]               = useState<ViewMode>('write');
  const [content, setContent]         = useState('');
  const [vessel, setVessel]           = useState<Vessel | null>(null);
  const [savedEntries, setSavedEntries] = useState<ContainerEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ContainerEntry | null>(null);

  // Load on mount
  useEffect(() => {
    AsyncStorage.getItem('container_entries').then(stored => {
      if (stored) setSavedEntries(JSON.parse(stored));
    }).catch(() => {});
  }, []);

  // Save when a vessel is chosen
  async function selectVessel(v: Vessel) {
    setVessel(v);
    setView('seal');
    const entry: ContainerEntry = {
      id: `${Date.now()}`,
      content: content.trim(),
      vesselId: v.id,
      date: new Date().toISOString(),
    };
    const updated = [entry, ...savedEntries];
    setSavedEntries(updated);
    try {
      await AsyncStorage.setItem('container_entries', JSON.stringify(updated));
    } catch { /* silent */ }
  }

  async function deleteEntry(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = savedEntries.filter(e => e.id !== id);
    setSavedEntries(updated);
    try {
      await AsyncStorage.setItem('container_entries', JSON.stringify(updated));
    } catch { /* silent */ }
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setView('archive');
    }
  }

  const reset = () => { setContent(''); setVessel(null); setView('write'); };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Image source={require('@/../assets/images/Copilot_20260531_173831.png')} style={[StyleSheet.absoluteFill, { opacity: 0.22 }]} resizeMode="cover" />
      <LinearGradient
        colors={PAGE_GRADIENT}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { height: height * 0.52 }]}
      />
      {view === 'seal' && vessel ? (
        <SealView vessel={vessel} onDone={reset} />
      ) : view === 'vessel' ? (
        <VesselView
          content={content}
          onBack={() => setView('write')}
          onSelect={selectVessel}
        />
      ) : view === 'archive' ? (
        <ArchiveView
          entries={savedEntries}
          onBack={() => setView('write')}
          onDelete={deleteEntry}
          onSelect={entry => { setSelectedEntry(entry); setView('reading'); }}
        />
      ) : view === 'reading' && selectedEntry ? (
        <ReadingView
          entry={selectedEntry}
          onBack={() => setView('archive')}
          onDelete={deleteEntry}
        />
      ) : (
        <WriteView
          content={content}
          setContent={setContent}
          onNext={() => setView('vessel')}
          onOpenArchive={() => setView('archive')}
          archiveCount={savedEntries.length}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Write
  writeScroll: { paddingHorizontal: Space.lg, paddingBottom: Space.xl + 32 },
  header: { marginBottom: Space.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontSize: 42, lineHeight: 46, letterSpacing: -0.5, marginBottom: 12 },
  rule: { width: 32, height: 3, borderRadius: 2, marginBottom: 12, opacity: 0.85 },
  pageSubtitle: { fontSize: 15, fontStyle: 'italic', lineHeight: 22, marginBottom: Space.sm },
  pageDesc: { fontSize: 13, lineHeight: 21 },

  // Archive icon + badge
  archiveBtn: { alignItems: 'center', paddingTop: Space.xs },
  badge: {
    position: 'absolute', top: 0, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Archive list
  archiveScroll: { paddingHorizontal: Space.lg, paddingBottom: Space.xl + 32 },
  archiveHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Space.xl },
  archiveList: { gap: Space.sm },
  emptyText: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', marginTop: Space.xxl },
  archiveCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Space.md, gap: Space.xs },
  archiveCardTop: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  archiveVesselBadge: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  archiveVesselName: { fontSize: 13, fontWeight: '600', flex: 1 },
  archiveDate: { fontSize: 11, letterSpacing: 0.2 },
  archivePreview: { fontSize: 13, lineHeight: 20, marginLeft: 36 },

  // Reading view
  readingScroll: { paddingHorizontal: Space.lg, paddingBottom: Space.xl + 32 },
  readingVesselTag: {
    flexDirection: 'row', alignItems: 'center', gap: Space.xs,
    alignSelf: 'flex-start', borderRadius: Radius.round,
    paddingHorizontal: Space.md, paddingVertical: Space.xs + 2,
    borderWidth: 1, marginBottom: Space.sm,
  },
  readingVesselLabel: { fontSize: 13, fontWeight: '600' },
  readingDate: { fontSize: 12, marginBottom: Space.lg, letterSpacing: 0.2 },
  readingContent: { fontSize: 18, lineHeight: 30, marginBottom: Space.xxl },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Space.xs, paddingVertical: Space.sm + 2,
    borderRadius: Radius.md, borderWidth: 1,
  },
  deleteBtnLabel: { fontSize: 14 },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Space.md,
    minHeight: 180,
    marginBottom: Space.lg,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 150,
    fontStyle: 'italic',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    borderRadius: Radius.lg,
    padding: Space.md,
  },
  ctaBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Vessel
  vesselScroll: { paddingHorizontal: Space.lg, paddingBottom: Space.xl + 32 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: Space.sm, marginBottom: Space.md,
  },
  backText: { fontSize: 14 },
  vesselHeader: { marginBottom: Space.lg },
  vesselTitle: { fontSize: 26, lineHeight: 32, marginBottom: Space.md },
  previewBubble: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Space.md,
  },
  previewText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  vesselGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  // 2×width + 12px gap must fit within 100% on all screens (see home grid)
  vesselCardWrap: { width: '47.5%' },
  vesselCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Space.md,
    gap: Space.xs + 2,
    // Tall enough for a two-line description ("Vault" wraps) so all six
    // cards in the grid render at the same height.
    minHeight: 146,
  },
  vesselIconBadge: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 4,
  },
  vesselLabel: { fontSize: 16, lineHeight: 20 },
  vesselDesc: { fontSize: 11.5, lineHeight: 16 },

  // Seal
  sealRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.lg,
  },
  sealCircleArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealIconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  sealVesselName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: -Space.sm,
  },
  sealTitle: {
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  sealSub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Space.xl,
  },
  doneBtn: {
    borderWidth: 1,
    borderRadius: Radius.round,
    paddingHorizontal: Space.xl + 8,
    paddingVertical: Space.sm + 4,
    marginTop: Space.sm,
  },
  doneBtnText: { fontSize: 15, fontWeight: '500' },
});
