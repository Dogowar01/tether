// Tether does not use Live Activities.
// This stub satisfies the ReactNativeWidgetExtensionModule requirement from
// the package's expo-module.config.json without exposing any Live Activity methods.
import ExpoModulesCore

public class ReactNativeWidgetExtensionModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ReactNativeWidgetExtension")
    }
}
