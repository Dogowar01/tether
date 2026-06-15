import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accent, Font, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { setWidgetAnchors } from 'shared-defaults';

// ── Types ──────────────────────────────────────────────────────────────────

interface Anchor {
  id: string;
  name: string;
  createdAt: number;
}

// ── Storage ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tether:anchors';

async function loadAnchors(): Promise<Anchor[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Anchor[]) : [];
  } catch {
    return [];
  }
}

async function persistAnchors(anchors: Anchor[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(anchors));
  } catch {}
}

// ── Colours ────────────────────────────────────────────────────────────────

const acc = Accent.terra;

const PAGE_GRADIENT = [
  'rgba(176,120,152,0.40)',
  'rgba(176,120,152,0.10)',
  'rgba(26,24,32,0)',
] as const;

const CARD_BG     = 'rgba(36,24,32,0.85)';
const CARD_BORDER = 'rgba(176,120,152,0.22)';

// ── Breathing ring (use-view) ──────────────────────────────────────────────

function BreathRing() {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.22);

  useEffect(() => {
    // Slow 4 s inhale / 4 s exhale
    scale.value = withRepeat(
      withSequence(
        withTiming(1.65, { duration: 4000 }),
        withTiming(1.00, { duration: 4000 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.50, { duration: 4000 }),
        withTiming(0.15, { duration: 4000 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 1.5,
          borderColor: acc.base,
        },
        animStyle,
      ]}
    />
  );
}

// ── Use view ───────────────────────────────────────────────────────────────

function UseView({ anchor, onClose }: { anchor: Anchor; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const fade   = useSharedValue(0);
  const slideY = useSharedValue(24);

  useEffect(() => {
    fade.value   = withTiming(1, { duration: 380 });
    slideY.value = withSpring(0, { damping: 22, stiffness: 180 });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity:   fade.value,
    transform: [{ translateY: slideY.value }],
  }));

  return (
    <View style={[useViewStyles.root, { backgroundColor: acc.bgD }]}>
      <LinearGradient
        colors={['rgba(176,120,152,0.28)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[useViewStyles.content, contentStyle]}>
        {/* Orb + ring */}
        <View style={useViewStyles.orbWrap}>
          <BreathRing />
          <View style={[useViewStyles.orb, { borderColor: acc.base, backgroundColor: 'rgba(176,120,152,0.12)' }]}>
            <Text style={useViewStyles.orbGlyph}>⚓</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={[useViewStyles.name, { color: acc.text.dark, fontFamily: Font.serif }]}>
          {anchor.name}
        </Text>

        {/* Prompt */}
        <Text style={useViewStyles.prompt}>
          Bring your full attention here.
        </Text>
      </Animated.View>

      {/* Dismiss */}
      <Pressable
        onPress={onClose}
        style={[useViewStyles.closeBtn, { paddingBottom: insets.bottom + Space.xl }]}
      >
        <Text style={useViewStyles.closeText}>Release</Text>
      </Pressable>
    </View>
  );
}

const useViewStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xxl,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlyph: {
    fontSize: 28,
  },
  name: {
    fontSize: 30,
    textAlign: 'center',
    marginHorizontal: Space.xl,
    marginBottom: Space.md,
    lineHeight: 40,
  },
  prompt: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: Space.xl,
    color: 'rgba(224,168,200,0.60)',
    letterSpacing: 0.3,
  },
  closeBtn: {
    paddingTop: Space.lg,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(224,168,200,0.55)',
  },
});

// ── Add modal (bottom sheet) ───────────────────────────────────────────────

function AddModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName('');
  }

  function handleClose() {
    setName('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/* Tappable backdrop */}
      <Pressable style={addStyles.backdrop} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={addStyles.kvWrap}
      >
        <View
          style={[
            addStyles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: CARD_BORDER,
              paddingBottom: insets.bottom + Space.lg,
            },
          ]}
        >
          {/* Drag handle */}
          <View style={[addStyles.handle, { backgroundColor: colors.border }]} />

          <Text style={[addStyles.sheetTitle, { color: colors.text, fontFamily: Font.serif }]}>
            Name your anchor
          </Text>
          <Text style={[addStyles.sheetSub, { color: colors.muted }]}>
            Something that reliably brings you back — a smell, a sound, a memory.
          </Text>

          <TextInput
            style={[
              addStyles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface2,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g. Morning coffee, sound of rain…"
            placeholderTextColor={colors.dim}
            value={name}
            onChangeText={setName}
            maxLength={60}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              addStyles.saveBtn,
              { backgroundColor: acc.base, opacity: !name.trim() || pressed ? 0.55 : 1 },
            ]}
          >
            <Text style={addStyles.saveBtnText}>Save anchor</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const addStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  kvWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Space.lg,
  },
  sheetTitle: {
    fontSize: 22,
    marginBottom: Space.sm,
  },
  sheetSub: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: Space.lg,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Space.md,
    fontSize: 16,
    marginBottom: Space.lg,
  },
  saveBtn: {
    borderRadius: Radius.round,
    paddingVertical: Space.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

// ── Anchor card ────────────────────────────────────────────────────────────

function AnchorCard({
  anchor,
  onPress,
  onDelete,
}: {
  anchor: Anchor;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withTiming(0.97, { duration: 70 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          cardStyle,
          cardStyles.card,
          { backgroundColor: CARD_BG, borderColor: CARD_BORDER },
        ]}
      >
        {/* Accent left bar */}
        <View style={[cardStyles.leftBar, { backgroundColor: acc.base }]} />

        <Text style={[cardStyles.name, { color: colors.text }]} numberOfLines={2}>
          {anchor.name}
        </Text>

        <Pressable onPress={onDelete} hitSlop={16} style={cardStyles.deleteBtn}>
          <Ionicons name="close" size={16} color={colors.dim} />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    marginHorizontal: Space.lg,
    marginBottom: Space.sm,
    paddingVertical: Space.md,
    paddingRight: Space.md,
    overflow: 'hidden',
  },
  leftBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: Space.md,
    marginLeft: Space.md,
  },
  name: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  deleteBtn: {
    padding: Space.sm,
    marginLeft: Space.sm,
  },
});

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={emptyStyles.root}>
      <Text style={[emptyStyles.glyph, { color: acc.base }]}>⚓</Text>
      <Text style={[emptyStyles.title, { color: colors.text, fontFamily: Font.serif }]}>
        No anchors yet
      </Text>
      <Text style={[emptyStyles.body, { color: colors.muted }]}>
        Anchors are things that reliably bring you back — a smell, a sound, a place, a memory.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          emptyStyles.addBtn,
          { backgroundColor: acc.base, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={emptyStyles.addBtnText}>Add your first anchor</Text>
      </Pressable>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.xl,
  },
  glyph: {
    fontSize: 40,
    marginBottom: Space.lg,
    opacity: 0.55,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: Space.sm,
  },
  body: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Space.xl,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.round,
    paddingVertical: Space.md,
    paddingHorizontal: Space.xl,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

// ── FAB ────────────────────────────────────────────────────────────────────

function FAB({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  const scale = useSharedValue(1);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 12 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable onPress={handlePress} style={[fabStyles.wrap, { bottom }]}>
      <Animated.View style={[fabStyles.fab, { backgroundColor: acc.base }, fabStyle]}>
        <Ionicons name="add" size={28} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

const fabStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: Space.xl,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────

export default function AnchorsScreen() {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [anchors, setAnchors]           = useState<Anchor[]>([]);
  const [activeAnchor, setActiveAnchor] = useState<Anchor | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [loaded, setLoaded]             = useState(false);

  // Load from storage on mount
  useEffect(() => {
    loadAnchors().then(stored => {
      setAnchors(stored);
      setLoaded(true);
    });
  }, []);

  // Persist on change — but never before the initial load resolves,
  // otherwise the mount-time [] would overwrite saved anchors.
  // Also sync the most recent anchor to the widget shared container.
  useEffect(() => {
    if (loaded) {
      persistAnchors(anchors);
      setWidgetAnchors(anchors.map(a => a.name)).catch(() => {});
    }
  }, [anchors, loaded]);

  function handleAdd(name: string) {
    const anchor: Anchor = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      createdAt: Date.now(),
    };
    setAnchors(prev => [anchor, ...prev]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnchors(prev => prev.filter(a => a.id !== id));
  }

  // The tab scene already ends above the tab bar (the custom tab bar is
  // rendered below the scene, not overlapping it), so the FAB only needs
  // a small visual margin — not insets.bottom + tab bar height.
  const fabBottom = Space.lg;

  return (
    <View style={[screenStyles.root, { backgroundColor: colors.bg }]}>
      <Image source={require('@/../assets/images/sandandstone.png')} style={[StyleSheet.absoluteFill, { opacity: 0.16 }]} resizeMode="cover" />
      {/* Warm rose-blush gradient across top half */}
      <LinearGradient
        colors={PAGE_GRADIENT}
        style={[StyleSheet.absoluteFill, { height: height * 0.52 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ── Header ── */}
      <View style={[screenStyles.header, { paddingTop: insets.top + Space.lg }]}>
        <Text style={[screenStyles.title, { color: colors.text, fontFamily: Font.serif }]}>
          Anchors
        </Text>
        <View style={[screenStyles.rule, { backgroundColor: acc.base }]} />
        <Text style={[screenStyles.subtitle, { color: colors.muted }]}>
          Reach for what grounds you.
        </Text>
      </View>

      {/* ── Content ── */}
      {anchors.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: Space.md, paddingBottom: fabBottom + 60 }}
          showsVerticalScrollIndicator={false}
        >
          {anchors.map(anchor => (
            <AnchorCard
              key={anchor.id}
              anchor={anchor}
              onPress={() => setActiveAnchor(anchor)}
              onDelete={() => handleDelete(anchor.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── FAB (only when list has items) ── */}
      {anchors.length > 0 && (
        <FAB onPress={() => setShowAdd(true)} bottom={fabBottom} />
      )}

      {/* ── Add bottom sheet ── */}
      <AddModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={name => {
          handleAdd(name);
          setShowAdd(false);
        }}
      />

      {/* ── Use fullscreen modal ── */}
      <Modal
        visible={!!activeAnchor}
        animationType="fade"
        onRequestClose={() => setActiveAnchor(null)}
      >
        {activeAnchor && (
          <UseView anchor={activeAnchor} onClose={() => setActiveAnchor(null)} />
        )}
      </Modal>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Space.xl,
    paddingBottom: Space.md,
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
});
