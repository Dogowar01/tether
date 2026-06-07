import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Radius } from '@/constants/theme';

type Props = { children: React.ReactNode; style?: ViewStyle };

export function Card({ children, style }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#6B4020',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
