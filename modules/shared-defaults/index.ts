import { requireOptionalNativeModule } from 'expo-modules-core';

const SharedDefaultsModule = requireOptionalNativeModule('SharedDefaults');

export async function setWidgetAnchors(names: string[]): Promise<void> {
  return SharedDefaultsModule?.setAnchors(JSON.stringify(names));
}
