import { Redirect } from 'expo-router';

// Root index redirects to the tab group
export default function Root() {
  return <Redirect href="/(tabs)" />;
}
