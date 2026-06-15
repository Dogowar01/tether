import ExpoModulesCore
import WidgetKit

public class SharedDefaultsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SharedDefaults")

        // Writes the first anchor name to the App Group container and
        // tells WidgetKit to reload so the widget reflects the change immediately.
        AsyncFunction("setAnchors") { (namesJson: String) in
            let defaults = UserDefaults(suiteName: "group.com.signal9.tether")
            defaults?.set(namesJson, forKey: "tether.anchors")
            defaults?.synchronize()
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
