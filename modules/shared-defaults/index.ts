import { requireOptionalNativeModule } from 'expo-modules-core';

const SharedDefaultsModule = requireOptionalNativeModule('SharedDefaults');

export async function setWidgetAnchor(name: string): Promise<void> {
  return SharedDefaultsModule?.setAnchor(name);
}
