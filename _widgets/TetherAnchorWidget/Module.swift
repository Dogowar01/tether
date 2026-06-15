import ExpoModulesCore
import WidgetKit

public class ReactNativeWidgetExtensionModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ReactNativeWidgetExtension")

        // Writes anchor names (JSON array) to the App Group container
        // and reloads the widget timeline so it updates immediately.
        AsyncFunction("setAnchors") { (namesJson: String) in
            let defaults = UserDefaults(suiteName: "group.com.signal9.tether")
            defaults?.set(namesJson, forKey: "tether.anchors")
            defaults?.synchronize()
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
