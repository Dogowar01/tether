import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { TetherTabBar } from '@/components/TetherTabBar';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const bg = Colors[scheme === 'dark' ? 'dark' : 'light'].bg;

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: bg }}>
      <Tabs
        tabBar={props => <TetherTabBar {...props} />}
        screenOptions={{ headerShown: false }}
        sceneContainerStyle={{ backgroundColor: 'transparent' }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="witness" />
        <Tabs.Screen name="state-map" />
        <Tabs.Screen name="container" />
        <Tabs.Screen name="anchors" />
      </Tabs>
    </SafeAreaProvider>
  );
}
