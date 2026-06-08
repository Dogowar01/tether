import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const bg = Colors[scheme === 'dark' ? 'dark' : 'light'].bg;

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
    // contentStyle sets the Stack card's own background to match the app
    // theme — prevents the system white/grey from showing through any gap
    // at the bottom (home indicator area, safe-area edge, etc.)
    <Stack screenOptions={{
      headerShown: false,
      animation: 'fade',
      contentStyle: { backgroundColor: bg },
    }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
