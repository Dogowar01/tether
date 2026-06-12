import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Tether v1 is dark-only (see use-theme.ts) — the bg never changes.
  const bg = Colors.dark.bg;

  // Override React Navigation's built-in dark theme — its default
  // background is 'rgb(1,1,1)' (black) and card is 'rgb(18,18,18)'.
  // Any pixel not painted by our own screens would appear as a black bar.
  const navTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: bg, card: bg },
  };

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    // initialWindowMetrics: supplies the real device insets (notch, home
    // indicator) SYNCHRONOUSLY on first render.  Without this the provider
    // measures async — useSafeAreaInsets() returns bottom:0 until the
    // measurement resolves, so the tab bar's paddingBottom stays at 2px
    // instead of ~34px, leaving the home-indicator strip uncovered.
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ flex: 1, backgroundColor: bg }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: bg },
        }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
