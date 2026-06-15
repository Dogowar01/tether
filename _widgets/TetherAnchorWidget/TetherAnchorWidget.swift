import SwiftUI
import WidgetKit

// ── Palette ────────────────────────────────────────────────────────────────

private let widgetBg     = Color(red: 30/255,  green: 27/255,  blue: 40/255)
private let widgetPink   = Color(red: 176/255, green: 120/255, blue: 152/255)
private let widgetWhite  = Color.white
private let widgetMuted  = Color(white: 0.30)
private let widgetGhost  = Color(white: 0.45)
private let widgetLink   = URL(string: "tether:///anchors")!

// ── Data ───────────────────────────────────────────────────────────────────

struct AnchorEntry: TimelineEntry {
    let date: Date
    let anchors: [String]
}

// ── Provider ───────────────────────────────────────────────────────────────

struct AnchorProvider: TimelineProvider {
    private let appGroup   = "group.com.signal9.tether"
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
        var names: [String] = []
        if let raw  = defaults?.string(forKey: storageKey),
           let data = raw.data(using: .utf8),
           let list = try? JSONDecoder().decode([String].self, from: data) {
            names = list
        }
        return AnchorEntry(date: Date(), anchors: names)
    }
}

// ── Header row (shared) ────────────────────────────────────────────────────

private struct WidgetHeader: View {
    let label: String
    var body: some View {
        HStack(spacing: 5) {
            Text("⚓").font(.system(size: 10))
            Text(label)
                .font(.system(size: 9, weight: .semibold))
                .kerning(1.4)
                .foregroundStyle(widgetPink)
        }
    }
}

// ── Small widget ───────────────────────────────────────────────────────────

private struct SmallView: View {
    let anchors: [String]
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            WidgetHeader(label: "ANCHOR")
                .padding(.bottom, 10)

            if anchors.isEmpty {
                Text("Open Tether to add your first anchor")
                    .font(.system(size: 13))
                    .foregroundStyle(widgetGhost)
                    .italic()
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text(anchors[0])
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(widgetWhite)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)

            Text("Tether")
                .font(.system(size: 10, weight: .light))
                .foregroundStyle(widgetMuted)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(for: .widget) { widgetBg }
    }
}

// ── Medium widget ──────────────────────────────────────────────────────────

private struct MediumView: View {
    let anchors: [String]
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                WidgetHeader(label: "ANCHORS")
                Spacer()
                Text("Tether")
                    .font(.system(size: 9, weight: .light))
                    .foregroundStyle(widgetMuted)
            }
            .padding(.bottom, 10)

            if anchors.isEmpty {
                Text("Open Tether to add your first anchor")
                    .font(.system(size: 13))
                    .foregroundStyle(widgetGhost)
                    .italic()
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(anchors.prefix(3), id: \.self) { name in
                        HStack(spacing: 8) {
                            Rectangle()
                                .fill(widgetPink)
                                .frame(width: 2)
                                .cornerRadius(1)
                            Text(name)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(widgetWhite)
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
        .containerBackground(for: .widget) { widgetBg }
    }
}

// ── Widget entry view ──────────────────────────────────────────────────────

struct TetherAnchorWidgetView: View {
    var entry: AnchorEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Group {
            if family == .systemMedium {
                MediumView(anchors: entry.anchors)
            } else {
                SmallView(anchors: entry.anchors)
            }
        }
        .widgetURL(widgetLink)
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
        .description("Your grounding anchors at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
