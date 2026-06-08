import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TetherTabBar } from '@/components/TetherTabBar';

export default function TabsLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Tabs
        tabBar={props => <TetherTabBar {...props} />}
        screenOptions={{ headerShown: false }}
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
