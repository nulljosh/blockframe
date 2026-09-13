import SwiftUI

struct ContentView: View {
    @State private var state = EditorState()
    @State private var selection: Preset? = presets.first
    @State private var erasing = false
    @State private var fontSize: CGFloat = 13

    private static let minFontSize: CGFloat = 7
    private static let maxFontSize: CGFloat = 28

    var body: some View {
        VStack(spacing: 0) {
            toolbar
            Divider().overlay(Theme.rule)
            canvas
            Divider().overlay(Theme.rule)
            PaletteView(selection: $selection, erasing: $erasing)
        }
        .background(Theme.background)
        .preferredColorScheme(.light)
        .onAppear(perform: restore)
    }

    // MARK: - Pieces

    private var canvas: some View {
        ScrollView([.horizontal, .vertical]) {
            CanvasView(grid: state.grid, fontSize: fontSize, onTap: place)
                .padding(20)
        }
        .background(Theme.background)
    }

    private var toolbar: some View {
        HStack(spacing: 16) {
            Text("Block Frame")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Theme.ink)

            Spacer()

            toolButton("Undo", systemImage: "arrow.uturn.backward", enabled: state.canUndo, action: undo)
                .keyboardShortcut("z", modifiers: .command)
            toolButton("Redo", systemImage: "arrow.uturn.forward", enabled: state.canRedo, action: redo)
                .keyboardShortcut("z", modifiers: [.command, .shift])

            toolButton("Erase", systemImage: "eraser", enabled: true, active: erasing) {
                erasing.toggle()
                if erasing { selection = nil }
            }

            toolButton("Zoom out", systemImage: "minus.magnifyingglass",
                       enabled: fontSize > Self.minFontSize) {
                fontSize = max(Self.minFontSize, fontSize - 1)
            }
            toolButton("Zoom in", systemImage: "plus.magnifyingglass",
                       enabled: fontSize < Self.maxFontSize) {
                fontSize = min(Self.maxFontSize, fontSize + 1)
            }

            toolButton("Clear", systemImage: "trash", enabled: true, action: clear)

            ShareLink(item: state.text) {
                Label("Export", systemImage: "square.and.arrow.up")
                    .labelStyle(.iconOnly)
                    .foregroundStyle(Theme.ink)
            }
            .accessibilityLabel("Export as text")
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Theme.background)
    }

    private func toolButton(
        _ label: String,
        systemImage: String,
        enabled: Bool,
        active: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .foregroundStyle(active ? Theme.accent : (enabled ? Theme.ink : Theme.muted))
        }
        .disabled(!enabled)
        .accessibilityLabel(label)
        .accessibilityAddTraits(active ? [.isSelected] : [])
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

    private func redo() {
        state.redo()
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

    // ponytail: write on every edit — the canvas is ~5KB, so debouncing would be
    // machinery protecting nothing.
    private func persist() {
        Store.save(state.text)
    }
}
