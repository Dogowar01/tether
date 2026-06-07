import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accent, Font, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ── Slide definitions ──────────────────────────────────────────────────────

interface ToolSlide {
  type: 'tool';
  glyph: string;
  name: string;
  desc: string;
  accentBase: string;
  accentText: string;
  gradientColor: string;
}
interface SimpleSlide { type: 'welcome' | 'name' | 'ready'; }
type Slide = SimpleSlide | ToolSlide;

const SLIDES: Slide[] = [
  { type: 'welcome' },
  {
    type: 'tool',
    glyph: '◉',
    name: 'The Witness',
    desc: "Share what's weighing on you. An AI listener that doesn't judge, fix, or advise.",
    accentBase: Accent.amber.base,
    accentText: Accent.amber.text.dark,
    gradientColor: 'rgba(200,120,72,0.22)',
  },
  {
    type: 'tool',
    glyph: '≋',
    name: 'State Map',
    desc: 'A short check-in to understand where your nervous system is right now.',
    accentBase: Accent.sage.base,
    accentText: Accent.sage.text.dark,
    gradientColor: 'rgba(138,189,168,0.22)',
  },
  {
    type: 'tool',
    glyph: '▣',
    name: 'The Container',
    desc: 'Write something down, choose where to hold it, and set it down safely.',
    accentBase: Accent.slate.base,
    accentText: Accent.slate.text.dark,
    gradientColor: 'rgba(120,100,168,0.22)',
  },
  {
    type: 'tool',
    glyph: '⚓',
    name: 'Anchors',
    desc: 'Your personal library of things that bring you back.',
    accentBase: Accent.terra.base,
    accentText: Accent.terra.text.dark,
    gradientColor: 'rgba(176,120,152,0.22)',
  },
  { type: 'name' },
  { type: 'ready' },
];

const TOTAL = SLIDES.length; // 7 slides, dots shown for 0–5

// ── Helpers ────────────────────────────────────────────────────────────────

async function completeOnboarding(name: string) {
  const pairs: [string, string][] = [['tether:onboarded', '1']];
  if (name.trim()) pairs.push(['tether:name', name.trim()]);
  await AsyncStorage.multiSet(pairs);
}

// ── Slide content components ───────────────────────────────────────────────

function WelcomeSlide({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={slideStyles.center}>
      <LinearGradient
        colors={['rgba(200,120,72,0.18)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
      />
      <Text style={[slideStyles.brand, { color: colors.text, fontFamily: Font.serif }]}>
        Tether
      </Text>
      <View style={[slideStyles.brandRule, { backgroundColor: Accent.amber.base }]} />
      <Text style={[slideStyles.tagline, { color: colors.muted, fontFamily: Font.serifItalic }]}>
        A quiet companion for the mind.
      </Text>
      <Text style={[slideStyles.descriptor, { color: colors.dim }]}>
        Not a journal. Not a therapist.{'\n'}Something closer to a trusted friend.
      </Text>
    </View>
  );
}

function ToolSlideView({ slide, colors }: { slide: ToolSlide; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={slideStyles.center}>
      <LinearGradient
        colors={[slide.gradientColor, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 0.8 }}
      />
      {/* Glyph */}
      <View style={[slideStyles.glyphRing, { borderColor: `${slide.accentBase}40` }]}>
        <Text style={[slideStyles.glyph, { color: slide.accentBase }]}>{slide.glyph}</Text>
      </View>

      {/* Name + rule + desc */}
      <Text style={[slideStyles.toolName, { color: colors.text, fontFamily: Font.serif }]}>
        {slide.name}
      </Text>
      <View style={[slideStyles.toolRule, { backgroundColor: slide.accentBase }]} />
      <Text style={[slideStyles.toolDesc, { color: colors.muted, fontFamily: Font.serifItalic }]}>
        {slide.desc}
      </Text>
    </View>
  );
}

function NameSlide({
  name,
  onChange,
  colors,
  height,
}: {
  name: string;
  onChange: (t: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  height: number;
}) {
  return (
    <View style={[slideStyles.nameRoot, { paddingTop: height * 0.22 }]}>
      <Text style={[slideStyles.nameTitle, { color: colors.text, fontFamily: Font.serif }]}>
        What should I call you?
      </Text>
      <Text style={[slideStyles.nameHint, { color: colors.dim }]}>
        Optional · stays only on this device
      </Text>
      <TextInput
        style={[
          slideStyles.nameInput,
          {
            color: colors.text,
            borderBottomColor: colors.border,
          },
        ]}
        placeholder="First name or nickname"
        placeholderTextColor={colors.dim}
        value={name}
        onChangeText={onChange}
        maxLength={32}
        autoCapitalize="words"
        returnKeyType="done"
        autoCorrect={false}
      />
    </View>
  );
}

function ReadySlide({ name, colors }: { name: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  const greeting = name.trim() ? `Hello, ${name.trim()}.` : "You're all set.";

  return (
    <View style={slideStyles.center}>
      <LinearGradient
        colors={['rgba(200,120,72,0.15)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 0.7 }}
      />
      <Text style={[slideStyles.readyGreeting, { color: colors.text, fontFamily: Font.serif }]}>
        {greeting}
      </Text>
      <Text style={[slideStyles.readySub, { color: colors.muted, fontFamily: Font.serifItalic }]}>
        Tether is yours now.
      </Text>
    </View>
  );
}

// ── Dot indicator ──────────────────────────────────────────────────────────

function Dots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === current
              ? { backgroundColor: Accent.amber.base, width: 18 }
              : { backgroundColor: 'rgba(255,255,255,0.25)', width: 6 },
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Space.lg,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const scrollRef  = useRef<ScrollView>(null);
  const [current, setCurrent]  = useState(0);
  const [name,    setName]     = useState('');

  const isLastSlide = current === TOTAL - 1;

  function goTo(index: number) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrent(index);
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastSlide) {
      handleBegin();
    } else {
      goTo(current + 1);
    }
  }

  async function handleBegin() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding(name);
    router.replace('/(tabs)');
  }

  const btnLabel  = isLastSlide ? 'Begin' : current === TOTAL - 2 ? 'Continue' : 'Next';
  const showDots  = current < TOTAL - 1; // no dots on ready slide

  return (
    <View style={[screen.root, { backgroundColor: colors.bg }]}>
      {/* ── Slides ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrent(idx);
        }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width, height }}>
            {slide.type === 'welcome' && (
              <WelcomeSlide colors={colors} />
            )}
            {slide.type === 'tool' && (
              <ToolSlideView slide={slide} colors={colors} />
            )}
            {slide.type === 'name' && (
              <NameSlide
                name={name}
                onChange={setName}
                colors={colors}
                height={height}
              />
            )}
            {slide.type === 'ready' && (
              <ReadySlide name={name} colors={colors} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* ── Footer: dots + button ── */}
      <View
        style={[
          screen.footer,
          { paddingBottom: insets.bottom + Space.lg, paddingTop: Space.md },
        ]}
      >
        {showDots && <Dots current={current} total={TOTAL - 1} />}

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            screen.btn,
            isLastSlide && screen.btnLarge,
            {
              backgroundColor: Accent.amber.base,
              opacity: pressed ? 0.85 : 1,
              marginHorizontal: isLastSlide ? Space.xl : Space.xl * 2,
            },
          ]}
        >
          <Text style={[screen.btnText, isLastSlide && screen.btnTextLarge]}>
            {btnLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Shared slide styles ────────────────────────────────────────────────────

const slideStyles = StyleSheet.create({
  // Welcome + tool + ready: centered layout
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.xl,
  },

  // Welcome
  brand: {
    fontSize: 56,
    letterSpacing: -1,
    marginBottom: Space.sm,
  },
  brandRule: {
    width: 48,
    height: 2,
    borderRadius: 1,
    marginBottom: Space.lg,
  },
  tagline: {
    fontSize: 19,
    textAlign: 'center',
    marginBottom: Space.md,
    lineHeight: 28,
  },
  descriptor: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
  },

  // Tool
  glyphRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xl,
  },
  glyph: {
    fontSize: 52,
    lineHeight: 60,
  },
  toolName: {
    fontSize: 28,
    marginBottom: Space.sm,
    textAlign: 'center',
  },
  toolRule: {
    width: 36,
    height: 2,
    borderRadius: 1,
    marginBottom: Space.md,
  },
  toolDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },

  // Name
  nameRoot: {
    flex: 1,
    paddingHorizontal: Space.xl,
    alignItems: 'flex-start',
  },
  nameTitle: {
    fontSize: 28,
    marginBottom: Space.sm,
    lineHeight: 38,
  },
  nameHint: {
    fontSize: 13,
    marginBottom: Space.xl,
  },
  nameInput: {
    alignSelf: 'stretch',
    fontSize: 22,
    paddingVertical: Space.sm,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },

  // Ready
  readyGreeting: {
    fontSize: 38,
    textAlign: 'center',
    marginBottom: Space.md,
    lineHeight: 50,
  },
  readySub: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.65,
  },
});

// ── Screen styles ──────────────────────────────────────────────────────────

const screen = StyleSheet.create({
  root: { flex: 1 },
  footer: {
    alignItems: 'center',
    paddingHorizontal: Space.xl,
  },
  btn: {
    alignSelf: 'stretch',
    borderRadius: Radius.round,
    paddingVertical: Space.md,
    alignItems: 'center',
  },
  btnLarge: {
    paddingVertical: Space.md + 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  btnTextLarge: {
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
