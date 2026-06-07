import { Text, TextStyle } from 'react-native';
import { Font } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BaseProps = { children: React.ReactNode; style?: TextStyle };

export function Serif({ children, style }: BaseProps) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontFamily: Font.serif, color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function SerifItalic({ children, style }: BaseProps) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontFamily: Font.serifItalic, color: colors.textSoft, fontStyle: 'italic' }, style]}>
      {children}
    </Text>
  );
}

export function Sans({ children, style }: BaseProps) {
  const { colors } = useTheme();
  return (
    <Text style={[{ color: colors.text, fontSize: 15, lineHeight: 22 }, style]}>
      {children}
    </Text>
  );
}

export function Label({ children, style }: BaseProps) {
  const { colors } = useTheme();
  return (
    <Text style={[{
      fontSize: 10, fontWeight: '600', letterSpacing: 1.2,
      textTransform: 'uppercase', color: colors.muted,
    }, style]}>
      {children}
    </Text>
  );
}
