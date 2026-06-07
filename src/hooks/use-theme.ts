import { useColorScheme } from 'react-native';
import { Accent, AccentKey, ColorScheme, Colors, getAccentBg, getAccentMid, getAccentText } from '@/constants/theme';

export function useTheme() {
  const raw = useColorScheme();
  const scheme: ColorScheme = raw === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];

  function accentBg(key: AccentKey) { return getAccentBg(key, scheme); }
  function accentMid(key: AccentKey) { return getAccentMid(key, scheme); }
  function accentText(key: AccentKey) { return getAccentText(key, scheme); }

  return { scheme, colors, Accent, accentBg, accentMid, accentText };
}
