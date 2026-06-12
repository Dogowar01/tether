import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptors: any;
};

const TABS = [
  { name: 'index',     iconName: 'home-outline',    label: 'Home'    },
  { name: 'witness',   iconName: 'create-outline',  label: 'Witness' },
  { name: 'state-map', iconName: 'pulse-outline',   label: 'State'   },
  { name: 'container', iconName: 'archive-outline', label: 'Contain' },
  { name: 'anchors',   iconName: 'compass-outline', label: 'Anchors' },
];

function TabItem({ tab, active, onPress }: {
  tab: typeof TABS[0]; active: boolean; onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale    = useSharedValue(1);
  const opacity  = useSharedValue(active ? 1 : 0.38);
  const dotScale = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    opacity.value  = withTiming(active ? 1 : 0.38, { duration: 220 });
    dotScale.value = withSpring(active ? 1 : 0, { damping: 18, stiffness: 300 });
  }, [active]);

  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const color = active ? Brand.lavender : colors.dim;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.86, { damping: 22, stiffness: 500 });
        if (!active) Haptics.selectionAsync();
      }}
      onPressOut={() => scale.value = withSpring(1, { damping: 16, stiffness: 300 })}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[styles.tabInner, itemStyle]}>
        <Ionicons name={tab.iconName as any} size={22} color={color} />

        {/* Lavender dot indicator */}
        <Animated.View style={[styles.dot, { backgroundColor: Brand.lavender }, dotStyle]} />

        <Text style={[styles.label, { color }]}>{tab.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function TetherTabBar({ state, navigation }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // insets.bottom is reliable: the root SafeAreaProvider gets
  // initialWindowMetrics, so the home-indicator inset (~34px on notched
  // iPhones) arrives synchronously. Keep a floor ONLY for notched devices
  // (top inset ≥ 40 — home-button iPhones report 20): a blanket 34px floor
  // painted a fake dark bar at the bottom on home-button devices, where
  // insets.bottom = 0 is the correct value.
  const bottomPad = Platform.OS === 'ios' && insets.top >= 40
    ? Math.max(insets.bottom, 34)
    : insets.bottom;

  return (
    <View style={[
      styles.bar,
      { backgroundColor: colors.bg, borderTopColor: colors.border, paddingBottom: bottomPad + 2 },
    ]}>
      {TABS.map((tab, i) => (
        <TabItem
          key={tab.name}
          tab={tab}
          active={state.index === i}
          onPress={() => {
            const route = state.routes[i];
            if (state.index !== i && route) navigation.navigate(route.name);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
