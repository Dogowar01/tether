import { requireNativeModule } from 'expo-modules-core';

const SharedDefaultsModule = requireNativeModule('SharedDefaults');

export async function setWidgetAnchor(name: string): Promise<void> {
  return SharedDefaultsModule.setAnchor(name);
}
