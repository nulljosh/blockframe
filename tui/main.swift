import Foundation
import SwiftTUI

// ponytail: fetches the live /api/components palette (ASC record and web domain are
// still "Wiretext" — see repo CLAUDE.md) and renders each component's own ASCII
// template, same static-render shape as the rest of the fleet's TUIs.

struct Component: Decodable, Identifiable {
    let id: String
    let label: String
    let category: String
    let template: [String]
}
struct Palette: Decodable { let count: Int; let components: [Component] }

func fetchPalette() async -> Palette? {
    guard let url = URL(string: "https://wiretext.heyitsmejosh.com/api/components") else { return nil }
    guard let (data, _) = try? await URLSession.shared.data(from: url) else { return nil }
    return try? JSONDecoder().decode(Palette.self, from: data)
}

struct PaletteCard: View {
    let palette: Palette?

    var body: some View {
        VStack(alignment: .leading) {
            Text("Block Frame components").bold()
            if let palette {
                ForEach(palette.components) { c in
                    Text("\(c.label) (\(c.category)): \(c.template.first ?? "")")
                }
            } else {
                Text("Could not reach wiretext.heyitsmejosh.com")
            }
        }
        .padding()
        .border()
    }
}

let semaphore = DispatchSemaphore(value: 0)
var palette: Palette?
Task {
    palette = await fetchPalette()
    semaphore.signal()
}
semaphore.wait()

Application(rootView: PaletteCard(palette: palette)).start()
