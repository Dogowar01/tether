import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Accent, AccentKey, Radius } from '@/constants/theme';

type Props = {
  on: boolean;
  accentKey?: AccentKey;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function PrimaryBtn({ on, accentKey = 'amber', onPress, children, style }: Props) {
  const scale = useSharedValue(1);
  const acc = Accent[accentKey];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (!on) return;
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={on ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.btn,
          {
            backgroundColor: on ? acc.btn : '#D4C4B0',
            shadowColor: on ? acc.btn : 'transparent',
          },
          style,
        ]}
      >
        <Text style={[styles.label, { color: on ? '#1C0E04' : '#A89888' }]}>
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.md,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
