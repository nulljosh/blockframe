import SwiftUI

struct ContentView: View {
    @State private var state = EditorState()
    @State private var selection: Preset? = presets.first
    @State private var erasing = false
    @State private var fontSize: CGFloat = 8

    private static let minFontSize: CGFloat = 5
    private static let maxFontSize: CGFloat = 14

    var body: some View {
        TabView {
            canvasPage
            PaletteView(selection: $selection, erasing: $erasing)
        }
        .tabViewStyle(.verticalPage)
        .onAppear(perform: restore)
    }

    // MARK: - Pages

    private var canvasPage: some View {
        NavigationStack {
            ScrollView([.horizontal, .vertical]) {
                CanvasView(grid: state.grid, fontSize: fontSize, onTap: place)
            }
            .background(Theme.background)
            .navigationTitle("Block Frame")
            .toolbar {
                ToolbarItemGroup(placement: .bottomBar) {
                    toolButton("Undo", systemImage: "arrow.uturn.backward", enabled: state.canUndo, action: undo)
                    toolButton("Erase", systemImage: erasing ? "eraser.fill" : "eraser", enabled: true) {
                        erasing.toggle()
                        if erasing { selection = nil }
                    }
                    toolButton("Clear", systemImage: "trash", enabled: true, action: clear)
                    ShareLink(item: state.text) {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .accessibilityLabel("Export as text")
                }
            }
        }
    }

    private func toolButton(
        _ label: String,
        systemImage: String,
        enabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .foregroundStyle(enabled ? Theme.ink : Theme.muted)
        }
        .disabled(!enabled)
        .accessibilityLabel(label)
    }

    // MARK: - Actions

    private func place(col: Int, row: Int) {
        if erasing {
            state.pushHistory()
            state.grid = setChar(state.grid, col: col, row: row, char: nil)
        } else if let preset = selection {
            state.pushHistory()
            state.grid = stampComponent(state.grid, template: preset.template, col: col, row: row)
        } else {
            return
        }
        persist()
    }

    private func undo() {
        state.undo()
        persist()
    }

    private func clear() {
        state.pushHistory()
        state.grid = createGrid(cols: state.cols, rows: state.rows)
        persist()
    }

    // MARK: - Persistence

    private func restore() {
        guard let saved = Store.load() else { return }
        state.grid = saved
    }

    // ponytail: write on every edit, same as iOS — the watch canvas is smaller still, so
    // debouncing protects nothing here either.
    private func persist() {
        Store.save(state.text)
    }
}
