import SwiftUI
import WidgetKit

// ── Data ───────────────────────────────────────────────────────────────────

struct AnchorEntry: TimelineEntry {
    let date: Date
    let anchors: [String]
}

// ── Provider ───────────────────────────────────────────────────────────────

struct AnchorProvider: TimelineProvider {
    private let appGroup  = "group.com.signal9.tether"
    private let storageKey = "tether.anchors"

    func placeholder(in context: Context) -> AnchorEntry {
        AnchorEntry(date: Date(), anchors: ["Morning coffee", "Sound of rain"])
    }

    func getSnapshot(in context: Context, completion: @escaping (AnchorEntry) -> Void) {
        completion(makeEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AnchorEntry>) -> Void) {
        completion(Timeline(entries: [makeEntry()], policy: .never))
    }

    private func makeEntry() -> AnchorEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        var anchors: [String] = []
        if let raw = defaults?.string(forKey: storageKey),
           let data = raw.data(using: .utf8),
           let decoded = try? JSONDecoder().decode([String].self, from: data) {
            anchors = decoded
        }
        return AnchorEntry(date: Date(), anchors: anchors)
    }
}

// ── Colours ────────────────────────────────────────────────────────────────

private let bgColor     = Color(red: 30/255,  green: 27/255,  blue: 40/255)
private let accentColor = Color(red: 176/255, green: 120/255, blue: 152/255)
private let deepLink    = URL(string: "tether:///anchors")!

// ── Small widget — shows most recent anchor ────────────────────────────────

struct SmallWidgetView: View {
    let anchors: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 5) {
                Text("⚓").font(.system(size: 10))
                Text("ANCHOR")
                    .font(.system(size: 9, weight: .semibold))
                    .kerning(1.4)
                    .foregroundColor(accentColor)
            }
            .padding(.bottom, 10)

            if anchors.isEmpty {
                Text("Open Tether to add your first anchor")
                    .font(.system(size: 13))
                    .foregroundColor(Color(white: 0.45))
                    .italic()
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text(anchors[0])
                    .font(.system(size: 17, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)

            Text("Tether")
                .font(.system(size: 10, weight: .light))
                .foregroundColor(Color(white: 0.30))
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(bgColor, for: .widget)
    }
}

// ── Medium widget — lists up to 3 anchors ─────────────────────────────────

struct MediumWidgetView: View {
    let anchors: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 5) {
                Text("⚓").font(.system(size: 10))
                Text("ANCHORS")
                    .font(.system(size: 9, weight: .semibold))
                    .kerning(1.4)
                    .foregroundColor(accentColor)
                Spacer()
                Text("Tether")
                    .font(.system(size: 9, weight: .light))
                    .foregroundColor(Color(white: 0.30))
            }
            .padding(.bottom, 10)

            if anchors.isEmpty {
                Text("Open Tether to add your first anchor")
                    .font(.system(size: 13))
                    .foregroundColor(Color(white: 0.45))
                    .italic()
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(anchors.prefix(3), id: \.self) { name in
                        HStack(spacing: 8) {
                            Rectangle()
                                .fill(accentColor)
                                .frame(width: 2)
                                .cornerRadius(1)
                            Text(name)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.white)
                                .lineLimit(1)
                        }
                        .frame(height: 20)
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(bgColor, for: .widget)
    }
}

// ── Widget definition ──────────────────────────────────────────────────────

struct TetherAnchorWidgetView: View {
    var entry: AnchorEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Group {
            if family == .systemMedium {
                MediumWidgetView(anchors: entry.anchors)
            } else {
                SmallWidgetView(anchors: entry.anchors)
            }
        }
        .widgetURL(deepLink)
    }
}

@main
struct TetherAnchorWidget: Widget {
    let kind = "TetherAnchorWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AnchorProvider()) { entry in
            TetherAnchorWidgetView(entry: entry)
        }
        .configurationDisplayName("Tether Anchor")
        .description("Your grounding anchors at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
