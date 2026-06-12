import { Tabs } from 'expo-router';
import { TetherTabBar } from '@/components/TetherTabBar';

export default function TabsLayout() {
  return (
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
  );
}
