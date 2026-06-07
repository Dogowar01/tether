import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NS_STATES, NSGuide, NSState } from '@/constants/data';
import { Accent, AccentKey, Font, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ViewMode = 'map' | 'detail' | 'guide';

const STATE_ICONS: Record<string, string> = {
  activated: 'flash-outline',
  steady:    'leaf-outline',
  shutdown:  'moon-outline',
};

// ── State card ─────────────────────────────────────────────────────────────

function StateCard({ state, index, onPress }: {
  state: NSState; index: number; onPress: () => void;
}) {
  const { colors } = useTheme();
  const acc = Accent[state.accent];
  const translateY = useSharedValue(24);
  const opacity   = useSharedValue(0);
  const scale     = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(index * 90 + 60, withSpring(0, { damping: 22, stiffness: 180 }));
    opacity.value    = withDelay(index * 90 + 60, withTiming(1, { duration: 340 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 22, stiffness: 400 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => scale.value = withSpring(1, { damping: 16, stiffness: 300 })}
        style={[styles.stateCard, {
          backgroundColor: 'rgba(18, 36, 28, 0.82)',
          borderColor: 'rgba(138,189,168,0.18)',
          borderLeftColor: acc.base,
        }]}
      >
        <View style={styles.stateCardRow}>
          <View style={[styles.stateIconBadge, {
            backgroundColor: acc.base + '18',
            borderColor: acc.base + '35',
          }]}>
            <Ionicons name={STATE_ICONS[state.id] as any} size={18} color="#FFFFFF" />
          </View>
          <View style={styles.stateCardText}>
            <Text style={[styles.stateLabel, { color: colors.text, fontFamily: Font.serif }]}>
              {state.label}
            </Text>
            <Text style={[styles.stateSub, { color: acc.base }]}>{state.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.dim} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Map view ───────────────────────────────────────────────────────────────

function MapView({ onSelect }: { onSelect: (s: NSState) => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
    <ScrollView
      contentContainerStyle={[styles.mapScroll, { paddingTop: insets.top + Space.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.mapHeader, headerStyle]}>
        <Text style={[styles.mapTitle, { color: colors.text, fontFamily: Font.serif }]}>
          State Map
        </Text>
        <View style={[styles.rule, { backgroundColor: Accent.sage.base }]} />
        <Text style={[styles.mapQuestion, { color: colors.muted }]}>
          How are you right now?
        </Text>
      </Animated.View>

      <View style={styles.stateList}>
        {NS_STATES.map((state, i) => (
          <StateCard key={state.id} state={state} index={i} onPress={() => onSelect(state)} />
        ))}
      </View>

      <Text style={[styles.footerNote, { color: colors.dimmer }]}>
        Choose the state that feels closest.
      </Text>
    </ScrollView>
  );
}

// ── Detail view ────────────────────────────────────────────────────────────

function DetailView({ state, onBack, onGuide }: {
  state: NSState; onBack: () => void; onGuide: () => void;
}) {
  const { colors } = useTheme();
  const acc = Accent[state.accent];
  const insets = useSafeAreaInsets();
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value    = withTiming(1, { duration: 280 });
    translateY.value = withSpring(0, { damping: 24, stiffness: 180 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    flex: 1,
  }));

  return (
    <Animated.View style={animStyle}>
      <ScrollView
        contentContainerStyle={[styles.detailScroll, { paddingTop: insets.top + Space.sm }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.dim} />
          <Text style={[styles.backText, { color: colors.dim }]}>State Map</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.detailHeader}>
          <View style={[styles.detailIconBadge, { backgroundColor: acc.base + '18' }]}>
            <Ionicons name={STATE_ICONS[state.id] as any} size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.detailLabel, { color: colors.text, fontFamily: Font.serif }]}>
            {state.label}
          </Text>
          <Text style={[styles.detailSub, { color: acc.base }]}>{state.sub}</Text>
          <Text style={[styles.detailDesc, { color: colors.muted }]}>{state.desc}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Tools */}
        <Text style={[styles.sectionHeading, { color: colors.dim }]}>WHAT MIGHT HELP</Text>
        {state.tools.map((tool, i) => (
          <View key={i} style={[styles.toolRow, { borderBottomColor: colors.borderSoft }]}>
            <View style={[styles.toolDot, { backgroundColor: acc.base }]} />
            <View style={styles.toolContent}>
              <Text style={[styles.toolName, { color: colors.text }]}>{tool.name}</Text>
              <Text style={[styles.toolDetail, { color: colors.muted }]}>{tool.detail}</Text>
            </View>
          </View>
        ))}

        {/* CTA */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onGuide(); }}
          style={[styles.guideBtn, { backgroundColor: acc.base }]}
        >
          <Ionicons name="play-circle-outline" size={20} color="#FFF" />
          <Text style={styles.guideBtnText}>Guide me through this</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

// ── Breath guide ───────────────────────────────────────────────────────────

function BreathGuide({
  guide, accent, onDone,
}: {
  guide: Extract<NSGuide, { type: 'breath' }>;
  accent: AccentKey;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const acc = Accent[accent];
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const circleSize = Math.min(W * 0.58, 230);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle]       = useState(1);
  const [timeLeft, setTimeLeft] = useState(guide.phases[0].dur);
  const [complete, setComplete] = useState(false);
  const circleScale = useSharedValue(0.38);

  const phase = guide.phases[phaseIdx];

  useEffect(() => {
    if (complete) return;
    const p = guide.phases[phaseIdx];
    circleScale.value = withTiming(p.scale, { duration: p.dur * 1000 });

    let t = p.dur;
    setTimeLeft(t);
    const id = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(id);
        const nextPhase = phaseIdx + 1;
        if (nextPhase >= guide.phases.length) {
          const nextCycle = cycle + 1;
          if (nextCycle > guide.cycles) {
            setComplete(true);
          } else {
            setCycle(nextCycle);
            setPhaseIdx(0);
          }
        } else {
          setPhaseIdx(nextPhase);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phaseIdx, cycle, complete]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  if (complete) {
    return (
      <View style={[styles.guideFull, {
        backgroundColor: 'transparent',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + Space.lg,
      }]}>
        <Ionicons name="checkmark-circle-outline" size={58} color={acc.base} />
        <Text style={[styles.completeTitle, { color: colors.text, fontFamily: Font.serif }]}>
          Well done.
        </Text>
        <Text style={[styles.completeSub, { color: colors.muted }]}>
          {guide.cycles} cycles complete.
        </Text>
        <Pressable onPress={onDone} style={[styles.doneBtn, { backgroundColor: acc.base }]}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.guideSpread, {
      backgroundColor: colors.bg,
      paddingTop: insets.top + Space.lg,
      paddingBottom: insets.bottom + Space.lg,
    }]}>
      {/* Counter + title */}
      <View style={styles.breathTop}>
        <Text style={[styles.smallLabel, { color: colors.dim }]}>
          breath {cycle} of {guide.cycles}
        </Text>
        <Text style={[styles.guideName, { color: colors.text, fontFamily: Font.serif }]}>
          {guide.title}
        </Text>
      </View>

      {/* Animated circle */}
      <View style={[styles.circleArea, { width: circleSize + 64, height: circleSize + 64 }]}>
        <View style={[styles.circleHalo, {
          width: circleSize + 64,
          height: circleSize + 64,
          borderRadius: (circleSize + 64) / 2,
          borderColor: acc.base + '22',
        }]} />
        <Animated.View style={[
          styles.breathCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: acc.base + '18',
            borderColor: acc.base + '55',
          },
          circleStyle,
        ]}>
          <Text style={[styles.phaseLabel, { color: colors.muted }]}>{phase.name}</Text>
          <Text style={[styles.phaseTimer, { color: acc.base }]}>
            {Math.max(1, timeLeft)}
          </Text>
        </Animated.View>
      </View>

      {/* Skip */}
      <Pressable onPress={onDone} style={styles.skipRow}>
        <Text style={[styles.skipText, { color: colors.dim }]}>end early</Text>
      </Pressable>
    </View>
  );
}

// ── Step guide (scan / activation) ────────────────────────────────────────

function StepGuide({
  guide, accent, onDone,
}: {
  guide: Extract<NSGuide, { type: 'scan' | 'activation' }>;
  accent: AccentKey;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const acc = Accent[accent];
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barWidth = W - Space.lg * 2;

  const [stepIdx, setStepIdx]   = useState(0);
  const [complete, setComplete] = useState(false);
  const progress = useSharedValue(1);

  const advance = () => {
    if (stepIdx + 1 >= guide.steps.length) {
      setComplete(true);
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  useEffect(() => {
    if (complete) return;
    const dur = guide.steps[stepIdx].dur;
    progress.value = 1;
    progress.value = withTiming(0, { duration: dur * 1000 });
    const t = setTimeout(advance, dur * 1000);
    return () => {
      cancelAnimation(progress);
      clearTimeout(t);
    };
  }, [stepIdx, complete]);

  const barStyle = useAnimatedStyle(() => ({
    width: barWidth * progress.value,
  }));

  if (complete) {
    return (
      <View style={[styles.guideFull, {
        backgroundColor: 'transparent',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + Space.lg,
      }]}>
        <Ionicons name="checkmark-circle-outline" size={58} color={acc.base} />
        <Text style={[styles.completeTitle, { color: colors.text, fontFamily: Font.serif }]}>
          Well done.
        </Text>
        <Text style={[styles.completeSub, { color: colors.muted }]}>
          {guide.title} complete.
        </Text>
        <Pressable onPress={onDone} style={[styles.doneBtn, { backgroundColor: acc.base }]}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const step = guide.steps[stepIdx];

  return (
    <View style={[styles.guideSpread, {
      backgroundColor: colors.bg,
      paddingTop: insets.top + Space.lg,
      paddingBottom: insets.bottom + Space.lg,
    }]}>
      {/* Top */}
      <View style={styles.stepTop}>
        <Text style={[styles.smallLabel, { color: colors.dim }]}>
          step {stepIdx + 1} of {guide.steps.length}
        </Text>
        <Text style={[styles.guideName, { color: colors.text, fontFamily: Font.serif }]}>
          {guide.title}
        </Text>
        <View style={styles.stepDots}>
          {guide.steps.map((_, i) => (
            <View
              key={i}
              style={[styles.stepDot, {
                backgroundColor: i <= stepIdx ? acc.base : colors.border,
                opacity: i < stepIdx ? 0.5 : 1,
              }]}
            />
          ))}
        </View>
      </View>

      {/* Prompt */}
      <View style={styles.promptArea}>
        <Text style={[styles.promptText, { color: colors.text }]}>{step.prompt}</Text>
      </View>

      {/* Bottom */}
      <View style={styles.stepBottom}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border, width: barWidth }]}>
          <Animated.View style={[styles.progressBar, { backgroundColor: acc.base }, barStyle]} />
        </View>
        <View style={styles.stepControls}>
          <Pressable onPress={onDone} style={styles.skipRow}>
            <Text style={[styles.skipText, { color: colors.dim }]}>end early</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); advance(); }}
            style={[styles.nextBtn, { backgroundColor: acc.base }]}
          >
            <Text style={styles.nextBtnText}>
              {stepIdx + 1 >= guide.steps.length ? 'Finish' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={15} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Guide router ──────────────────────────────────────────────────────────

function GuideView({ state, onDone }: { state: NSState; onDone: () => void }) {
  if (state.guide.type === 'breath') {
    return (
      <BreathGuide
        guide={state.guide as Extract<NSGuide, { type: 'breath' }>}
        accent={state.accent}
        onDone={onDone}
      />
    );
  }
  return (
    <StepGuide
      guide={state.guide as Extract<NSGuide, { type: 'scan' | 'activation' }>}
      accent={state.accent}
      onDone={onDone}
    />
  );
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function StateMapScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [view, setView]       = useState<ViewMode>('map');
  const [selected, setSelected] = useState<NSState | null>(null);

  const selectState = (s: NSState) => { setSelected(s); setView('detail'); };

  const gradientColors = [
    'rgba(138,189,168,0.40)',
    'rgba(138,189,168,0.10)',
    'rgba(26,24,32,0)',
  ] as const;

  const bgLayer = (
    <>
      <Image source={require('@/../assets/images/Copilot_20260531_173550.png')} style={[StyleSheet.absoluteFill, { opacity: 0.14 }]} resizeMode="cover" />
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { height: height * 0.52 }]}
      />
    </>
  );

  if (view === 'guide' && selected) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {bgLayer}
        <GuideView state={selected} onDone={() => setView('detail')} />
      </View>
    );
  }
  if (view === 'detail' && selected) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {bgLayer}
        <DetailView
          state={selected}
          onBack={() => setView('map')}
          onGuide={() => setView('guide')}
        />
      </View>
    );
  }
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {bgLayer}
      <MapView onSelect={selectState} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Map
  mapScroll: { paddingHorizontal: Space.lg, paddingBottom: Space.xl + 24 },
  mapHeader: { marginBottom: Space.xl },
  mapTitle: { fontSize: 42, lineHeight: 46, letterSpacing: -0.5, marginBottom: 12 },
  rule: { width: 32, height: 3, borderRadius: 2, marginBottom: 12, opacity: 0.8 },
  mapQuestion: { fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  stateList: { gap: 12, marginBottom: Space.lg },
  footerNote: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

  // State card
  stateCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: Space.md,
  },
  stateCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stateIconBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  stateCardText: { flex: 1 },
  stateLabel: { fontSize: 18, lineHeight: 22, marginBottom: 2 },
  stateSub: { fontSize: 12, fontWeight: '500', letterSpacing: 0.2 },

  // Detail
  detailScroll: { paddingHorizontal: Space.lg, paddingBottom: Space.xl + 40 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: Space.sm, marginBottom: Space.md,
  },
  backText: { fontSize: 14 },
  detailHeader: { alignItems: 'center', marginBottom: Space.lg },
  detailIconBadge: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  detailLabel: { fontSize: 32, lineHeight: 38, marginBottom: 6 },
  detailSub: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 12 },
  detailDesc: { fontSize: 14, lineHeight: 22, textAlign: 'center', fontStyle: 'italic' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Space.lg },
  sectionHeading: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: Space.sm,
  },
  toolRow: {
    flexDirection: 'row', gap: 12,
    paddingVertical: Space.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  toolContent: { flex: 1 },
  toolName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  toolDetail: { fontSize: 12.5, lineHeight: 19 },
  guideBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: Radius.lg, padding: Space.md, marginTop: Space.xl,
  },
  guideBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Guide shared
  guideFull: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md },
  guideSpread: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  skipRow: { paddingVertical: Space.sm + 2 },
  skipText: { fontSize: 13 },
  doneBtn: {
    paddingHorizontal: Space.xl + 8, paddingVertical: Space.sm + 4,
    borderRadius: Radius.round, marginTop: Space.sm,
  },
  doneBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  completeTitle: { fontSize: 30, marginTop: Space.sm },
  completeSub: { fontSize: 14, fontStyle: 'italic' },
  smallLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  guideName: { fontSize: 24, lineHeight: 28 },

  // Breath
  breathTop: { alignItems: 'center', gap: Space.xs },
  circleArea: { alignItems: 'center', justifyContent: 'center' },
  circleHalo: { position: 'absolute', borderWidth: 1 },
  breathCircle: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, gap: 6,
  },
  phaseLabel: { fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  phaseTimer: { fontSize: 44, fontWeight: '200', lineHeight: 50 },

  // Step
  stepTop: { alignItems: 'center', gap: Space.sm, paddingHorizontal: Space.lg },
  stepDots: { flexDirection: 'row', gap: 7, marginTop: Space.xs },
  stepDot: { width: 7, height: 7, borderRadius: 4 },
  promptArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Space.lg + Space.md,
  },
  promptText: { fontSize: 17, lineHeight: 29, textAlign: 'center', fontStyle: 'italic' },
  stepBottom: { width: '100%', gap: Space.md, paddingHorizontal: Space.lg },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: 3, borderRadius: 2 },
  stepControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Space.lg, paddingVertical: Space.sm,
    borderRadius: Radius.round,
  },
  nextBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
