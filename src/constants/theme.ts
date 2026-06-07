import { Platform } from 'react-native';

// ── Tether design tokens ──────────────────────────────────────────────────

export const Colors = {
  light: {
    bg: '#F5F2FA',
    bgWarm: '#EDE8F5',
    surface: '#FFFFFF',
    surface2: '#F8F6FD',
    surface3: '#F0EDF9',
    border: '#E0D9F0',
    borderSoft: '#EAE4F5',
    text: '#1E1830',
    textSoft: '#4A3868',
    muted: '#7A6E98',
    dim: '#A89EC8',
    dimmer: '#C8C0E0',
    crisis: '#B03060',
    crisisBg: '#FEF0F4',
    crisisBorder: '#B0306040',
  },
  dark: {
    bg: '#1E1B28',
    bgWarm: '#251F32',
    surface: '#2A2638',
    surface2: '#342F42',
    surface3: '#3E3A4E',
    border: '#403C54',
    borderSoft: '#362F48',
    text: '#F0EEF8',
    textSoft: '#C8C0E0',
    muted: '#8A84A8',
    dim: '#6A6480',
    dimmer: '#4A4460',
    crisis: '#E890B0',
    crisisBg: '#28182A',
    crisisBorder: '#E890B040',
  },
} as const;

// Brand identity — lavender primary, warm glow secondary
export const Brand = {
  lavender: '#9B7EC8',
  warm: '#C87848',
} as const;

// Tool accent palettes
export const Accent = {
  // The Witness — warm interior glow (the lit window against grey concrete)
  amber: {
    base:   '#C87848',
    btn:    '#E09A68',
    bgL:    '#FDF2E8',
    bgD:    '#2C1C10',
    midL:   '#F5E0C8',
    midD:   '#3C2818',
    text:   { light: '#8C4820', dark: '#F0A870' },
    ring:   '#C8784840',
  },
  // State Map — soft pastel green
  sage: {
    base:   '#8ABDA8',
    btn:    '#A4D0BC',
    bgL:    '#EDF6F2',
    bgD:    '#182820',
    midL:   '#D4EDE4',
    midD:   '#223830',
    text:   { light: '#2E6650', dark: '#A4D0BC' },
    ring:   '#8ABDA840',
  },
  // Container — deep violet
  slate: {
    base:   '#7864A8',
    btn:    '#9480C0',
    bgL:    '#F0ECFA',
    bgD:    '#1C1828',
    midL:   '#D8D0F0',
    midD:   '#2A2240',
    text:   { light: '#4A3078', dark: '#B8A8E0' },
    ring:   '#7864A840',
  },
  // Anchors — rose-blush, the pink sunset sky through upper windows
  terra: {
    base:   '#B07898',
    btn:    '#C890B0',
    bgL:    '#F8EEF4',
    bgD:    '#241820',
    midL:   '#F0D8E8',
    midD:   '#342030',
    text:   { light: '#7A3858', dark: '#E0A8C8' },
    ring:   '#B0789840',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
export type AccentKey = keyof typeof Accent;

export function getAccentBg(key: AccentKey, scheme: ColorScheme) {
  return scheme === 'dark' ? Accent[key].bgD : Accent[key].bgL;
}

export function getAccentMid(key: AccentKey, scheme: ColorScheme) {
  return scheme === 'dark' ? Accent[key].midD : Accent[key].midL;
}

export function getAccentText(key: AccentKey, scheme: ColorScheme) {
  return Accent[key].text[scheme];
}

// ── Typography ────────────────────────────────────────────────────────────

export const Font = {
  serif: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  serifMedium: 'PlayfairDisplay_500Medium',
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────

export const Space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Radii ─────────────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
} as const;
