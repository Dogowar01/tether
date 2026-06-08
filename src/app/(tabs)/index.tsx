import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accent, AccentKey, Brand, Font, Radius, Space } from '@/constants/theme';
import { TOOLS } from '@/constants/data';
import { useTheme } from '@/hooks/use-theme';

// Per-tool gradient config — diagonal, light to almost-transparent
const GRADIENTS: Record<AccentKey, {
  dark: readonly [string, string];
  light: readonly [string, string];
  border: { dark: string; light: string };
}> = {
  // Warm interior glow — terracotta amber
  amber: {
    dark:  ['rgba(200,120,72,0.55)', 'rgba(200,120,72,0.24)'],
    light: ['#FDF2E8',               '#FEF9F4'],
    border: { dark: 'rgba(200,120,72,0.58)', light: 'rgba(200,120,72,0.30)' },
  },
  // State Map — soft pastel green
  sage: {
    dark:  ['rgba(138,189,168,0.68)', 'rgba(138,189,168,0.30)'],
    light: ['#EDF6F2',                '#F5FAF8'],
    border: { dark: 'rgba(138,189,168,0.70)', light: 'rgba(138,189,168,0.30)' },
  },
  // Container — deep violet
  slate: {
    dark:  ['rgba(140,115,200,0.68)', 'rgba(120,100,168,0.30)'],
    light: ['#F0ECFA',                '#F8F6FD'],
    border: { dark: 'rgba(140,115,200,0.70)', light: 'rgba(120,100,168,0.30)' },
  },
  // Rose blush — pink sunset through upper windows
  terra: {
    dark:  ['rgba(195,135,168,0.68)', 'rgba(176,120,152,0.30)'],
    light: ['#F8EEF4',                '#FDF7FA'],
    border: { dark: 'rgba(195,135,168,0.70)', light: 'rgba(176,120,152,0.30)' },
  },
};

// ── Tool card ─────────────────────────────────────────────────────────────

function ToolCard({
  iconName, label, desc, accent, index, onPress,
}: {
  iconName: string; label: string; desc: string;
  accent: AccentKey; index: number; onPress: () => void;
}) {
  const { colors, scheme } = useTheme();
  const acc = Accent[accent];
  const grad = GRADIENTS[accent];

  const scale = useSharedValue(1);
  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * 90 + 100, withSpring(0, { damping: 20, stiffness: 160 }));
    opacity.value    = withDelay(index * 90 + 100, withTiming(1, { duration: 380 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.cardWrap, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 22, stiffness: 380 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => scale.value = withSpring(1, { damping: 15, stiffness: 260 })}
        style={{ borderRadius: Radius.xl, flex: 1 }}
      >
        <LinearGradient
          colors={scheme === 'dark' ? grad.dark : grad.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { borderColor: grad.border[scheme] }]}
        >
          {/* Accent top strip */}
          <View style={[styles.topStrip, { backgroundColor: acc.base }]} />

          {/* Icon badge */}
          <View style={[styles.glyphBadge, {
            backgroundColor: acc.base + '22',
            borderColor: acc.base + '38',
          }]}>
            <Ionicons name={iconName as any} size={22} color="#FFFFFF" />
          </View>

          <Text style={[styles.cardLabel, { color: colors.text, fontFamily: Font.serif }]}>
            {label}
          </Text>
          <Text style={[styles.cardDesc, { color: colors.muted }]}>{desc}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Home screen ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // ── Onboarding gate ──────────────────────────────────────────────────────
  // Checked here (inside the nav tree) so <Redirect> fires reliably.
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboarded,         setOnboarded]         = useState(true); // optimistic
  const [name,              setName]              = useState('');
  const [editingName,       setEditingName]       = useState(false);
  const [nameInput,         setNameInput]         = useState('');

  useEffect(() => {
    AsyncStorage.multiGet(['tether:onboarded', 'tether:name']).then(pairs => {
      const onboardedVal = pairs.find(([k]) => k === 'tether:onboarded')?.[1];
      const nameVal      = pairs.find(([k]) => k === 'tether:name')?.[1];
      setOnboarded(!!onboardedVal);
      setName(nameVal ?? '');
      setOnboardingChecked(true);
    });
  }, []);

  async function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      await AsyncStorage.setItem('tether:name', trimmed);
      setName(trimmed);
    } else {
      await AsyncStorage.removeItem('tether:name');
      setName('');
    }
    setEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const headerOpacity = useSharedValue(0);
  const headerY      = useSharedValue(-20);
  const crisisOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    headerY.value       = withSpring(0, { damping: 24, stiffness: 140 });
    crisisOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const crisisStyle = useAnimatedStyle(() => ({ opacity: crisisOpacity.value }));

  // Wait for storage check; redirect if not yet onboarded
  if (!onboardingChecked) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greeting = name ? `${timeGreeting}, ${name}` : timeGreeting;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Image source={require('@/../assets/images/lights.png')} style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} resizeMode="cover" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, headerStyle]}>
          {/* Greeting row with name-edit button */}
          <View style={styles.greetingRow}>
            <Text style={[styles.greeting, { color: colors.dim }]}>{greeting}</Text>
            <Pressable
              onPress={() => { setNameInput(name); setEditingName(true); }}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7 })}
            >
              <Ionicons name="person-circle-outline" size={20} color={colors.dim} />
            </Pressable>
          </View>

          <Text style={[styles.wordmark, { color: colors.text, fontFamily: Font.serif }]}>
            Tether
          </Text>

          {/* Lavender rule */}
          <View style={[styles.rule, { backgroundColor: Brand.lavender }]} />

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            A quiet set of tools for difficult moments.
          </Text>
        </Animated.View>

        {/* ── Tool grid ── */}
        <View style={styles.grid}>
          {TOOLS.map((tool, i) => (
            <ToolCard
              key={tool.id}
              iconName={tool.iconName}
              label={tool.label}
              desc={tool.desc}
              accent={tool.accent}
              index={i}
              onPress={() => router.push(`/(tabs)/${tool.id}` as any)}
            />
          ))}
        </View>

        {/* ── Crisis bar ── */}
        <Animated.View style={[
          styles.crisis,
          crisisStyle,
          { backgroundColor: colors.crisisBg, borderColor: colors.crisisBorder },
        ]}>
          <Text style={[styles.crisisLabel, { color: '#FFFFFF' }]}>IN CRISIS RIGHT NOW?</Text>
          <Text style={[styles.crisisNumber, { color: '#FFFFFF' }]}>
            Lifeline Australia — 13 11 14
          </Text>
          <Text style={[styles.crisisSub, { color: '#FFFFFF' }]}>
            Available 24 hours, 7 days.
          </Text>
        </Animated.View>

        {/* ── Dev reset (never ships to production) ── */}
        {__DEV__ && (
          <Pressable
            onPress={async () => {
              await AsyncStorage.multiRemove(['tether:onboarded', 'tether:name']);
              router.replace('/onboarding');
            }}
            style={({ pressed }) => [styles.devReset, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={[styles.devResetText, { color: colors.dimmer }]}>
              ⚙ Reset onboarding
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Name edit modal ── */}
      <Modal
        visible={editingName}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingName(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingName(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Font.serif }]}>
              What should I call you?
            </Text>
            <Text style={[styles.modalHint, { color: colors.dim }]}>
              Optional · stays only on this device
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderBottomColor: colors.border }]}
              placeholder="First name or nickname"
              placeholderTextColor={colors.dim}
              value={nameInput}
              onChangeText={setNameInput}
              maxLength={32}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => setEditingName(false)}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnGhost, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.modalBtnLabel, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveName}
                style={({ pressed }) => [styles.modalBtn, { backgroundColor: Accent.amber.base, opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={[styles.modalBtnLabel, { color: '#fff' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Space.lg,
    paddingBottom: Space.xl + 24,
  },

  // Header
  header: { marginBottom: Space.xl + 4 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  wordmark: {
    fontSize: 58,
    lineHeight: 62,
    letterSpacing: -1,
    marginBottom: 14,
  },
  rule: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 14,
    opacity: 0.7,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 23,
    fontStyle: 'italic',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Space.lg,
  },
  // minHeight ensures rows 1 & 2 match even though flexWrap sizes each
  // row independently; flex:1 on Pressable + card fills that height.
  cardWrap: { width: '48.3%', minHeight: 165 },

  // Card
  card: {
    flex: 1,                // fill the Pressable so the gradient covers full height
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 0,        // strip sits at edge
    paddingBottom: 20,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  topStrip: {
    height: 3,
    marginHorizontal: -18,
    marginBottom: 18,
    opacity: 0.6,
  },
  glyphBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  glyphText: {
    fontSize: 20,
    lineHeight: 24,
  },
  cardLabel: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Crisis
  crisis: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  crisisLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 5,
    opacity: 0.65,
  },
  crisisNumber: {
    fontSize: 15.5,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  crisisSub: {
    fontSize: 11.5,
    opacity: 0.5,
    textAlign: 'center',
  },

  // Dev reset
  devReset: {
    alignItems: 'center',
    paddingVertical: Space.lg,
  },
  devResetText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // Name modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Space.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Space.xl,
  },
  modalTitle: {
    fontSize: 22,
    lineHeight: 30,
    marginBottom: Space.xs,
  },
  modalHint: {
    fontSize: 12,
    marginBottom: Space.xl,
  },
  modalInput: {
    fontSize: 20,
    paddingVertical: Space.sm,
    borderBottomWidth: 1,
    marginBottom: Space.xl,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: Space.md - 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnGhost: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
