import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function CrisisBar() {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.crisisBg, borderColor: colors.crisisBorder }]}>
      <Text style={[styles.label, { color: '#FFFFFF' }]}>IN CRISIS RIGHT NOW?</Text>
      <Text style={[styles.line, { color: '#FFFFFF' }]}>Lifeline Australia — 13 11 14</Text>
      <Text style={[styles.sub, { color: '#FFFFFF' }]}>Available 24 hours, 7 days.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 4,
    opacity: 0.7,
  },
  line: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'PlayfairDisplay_400Regular',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  sub: {
    fontSize: 11,
    opacity: 0.55,
  },
});
