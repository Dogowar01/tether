import { Accent, AccentKey, ColorScheme, Colors, getAccentBg, getAccentMid, getAccentText } from '@/constants/theme';

export function useTheme() {
  // Tether v1 is dark-only: the screens' imagery, gradients, and several
  // hardcoded text colours are tuned for the dark palette. Forcing the scheme
  // here (rather than following the OS) also keeps web/PWA consistent, where
  // app.json's userInterfaceStyle has no effect.
  const scheme: ColorScheme = 'dark';
  const colors = Colors[scheme];

  function accentBg(key: AccentKey) { return getAccentBg(key, scheme); }
  function accentMid(key: AccentKey) { return getAccentMid(key, scheme); }
  function accentText(key: AccentKey) { return getAccentText(key, scheme); }

  return { scheme, colors, Accent, accentBg, accentMid, accentText };
}
