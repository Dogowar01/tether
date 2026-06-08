import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const raw    = useColorScheme();
  const scheme = raw === 'dark' ? 'dark' : 'light';
  const bg     = Colors[scheme].bg;

  // Override React Navigation's built-in dark theme — its default
  // background is 'rgb(1,1,1)' (black) and card is 'rgb(18,18,18)'.
  // Any pixel not painted by our own screens would appear as a black bar.
  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: bg,
      card:       bg,
    },
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
