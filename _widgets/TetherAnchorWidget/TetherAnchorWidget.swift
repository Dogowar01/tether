import SwiftUI
import WidgetKit

// ── Data ───────────────────────────────────────────────────────────────────

struct AnchorEntry: TimelineEntry {
    let date: Date
    let anchorName: String
}

// ── Provider ───────────────────────────────────────────────────────────────

struct AnchorProvider: TimelineProvider {
    private let appGroup = "group.com.signal9.tether"
    private let storageKey = "tether.anchor"

    func placeholder(in context: Context) -> AnchorEntry {
        AnchorEntry(date: Date(), anchorName: "Morning coffee")
    }

    func getSnapshot(in context: Context, completion: @escaping (AnchorEntry) -> Void) {
        completion(makeEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AnchorEntry>) -> Void) {
        // Policy .never means the widget only refreshes when the app calls
        // WidgetCenter.shared.reloadAllTimelines() after an anchor change.
        completion(Timeline(entries: [makeEntry()], policy: .never))
    }

    private func makeEntry() -> AnchorEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        let name = defaults?.string(forKey: storageKey) ?? ""
        return AnchorEntry(date: Date(), anchorName: name)
    }
}

// ── Widget view ────────────────────────────────────────────────────────────

struct TetherAnchorWidgetView: View {
    var entry: AnchorEntry
    @Environment(\.widgetFamily) var family

    // Brand colours matching the app
    private let bgColor    = Color(red: 30/255,  green: 27/255,  blue: 40/255)
    private let accentColor = Color(red: 176/255, green: 120/255, blue: 152/255)

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {

            // Header row
            HStack(spacing: 5) {
                Text("⚓")
                    .font(.system(size: 10))
                Text("ANCHOR")
                    .font(.system(size: 9, weight: .semibold))
                    .kerning(1.4)
                    .foregroundColor(accentColor)
            }
            .padding(.bottom, 10)

            // Anchor name or empty-state hint
            if entry.anchorName.isEmpty {
                Text("Open Tether to add your first anchor")
                    .font(.system(size: 13))
                    .foregroundColor(Color(white: 0.45))
                    .italic()
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text(entry.anchorName)
                    .font(.system(
                        size: family == .systemSmall ? 17 : 21,
                        weight: .medium
                    ))
                    .foregroundColor(.white)
                    .lineLimit(family == .systemSmall ? 3 : 2)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)

            // Footer wordmark
            Text("Tether")
                .font(.system(size: 10, weight: .light))
                .foregroundColor(Color(white: 0.35))
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(bgColor, for: .widget)
    }
}

// ── Widget definition ──────────────────────────────────────────────────────

@main
struct TetherAnchorWidget: Widget {
    let kind = "TetherAnchorWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AnchorProvider()) { entry in
            TetherAnchorWidgetView(entry: entry)
        }
        .configurationDisplayName("Tether Anchor")
        .description("Your current grounding anchor.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
