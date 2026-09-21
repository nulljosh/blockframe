# Architecture

A Unicode wireframe canvas editor for drawing ASCII box-drawing interfaces. Drag-and-drop component palette (buttons, input fields, etc.), undo/redo, grid-based snapping. Ships as a web app, iOS app, macOS app, and Android (Kotlin Multiplatform). A warm-paper theme (not shared portfolio tokens). Export as plain text, integrate via API or Claude MCP.

## How it runs

**Web**: React app in `src/App.jsx` renders a three-pane layout: toolbar (left), canvas (center), inspector (right). User selects a preset component from the palette, clicks to place it on the 100x50 character grid, drags to resize. Changes update a grid of characters in real time, exportable as plain text. No bundler, no build step for development (Vite in prod).

**iOS/macOS**: SwiftUI app in `ios/App/`. Canvas rendered as monospace Text (one Text per row, not per cell, for performance). Same grid engine as web (ported function-for-function from JavaScript). Persistent storage in Application Support folder.

**Android/Desktop (KMP)**: `kmp/shared/src/commonMain/kotlin/com/nulljosh/charwork/`. Shared engine logic ported to Kotlin. Platform-specific Compose UI in `kmp/composeApp/src/`.

## Web

| File | What it owns |
|---|---|
| `index.html` | React root, app shell |
| `vite.config.js` | Vite build config, React plugin, vendor chunking |
| `src/main.jsx` | React entry point |
| `src/App.jsx` | Main editor state (grid, elements, selection, undo history), click-to-place logic, keyboard shortcuts (Ctrl+Z undo, etc.) |
| `src/App.css` | Three-pane layout (toolbar/canvas/inspector), styling |
| `src/index.css` | Global reset, imports Jaybulb portfolio tokens |
| `src/tokens.css` | Warm-paper theme (paper bg, ink text, terracotta accent), separate from shared design system |
| `src/components/Canvas.jsx` + `Canvas.css` | Canvas grid render, character positioning, tap/click detection (pxToCell math), drag selection |
| `src/components/Toolbar.jsx` | Component palette, grouped by category (Input, Layout, Typography, etc.), click-to-select |
| `src/components/Inspector.jsx` + `Inspector.css` | Selected element details (position, size, text), live edit |
| `src/components/ElementOverlay.jsx` | Drag handles for resizing, move cursor, drag preview |
| `src/lib/engine.js` | Canvas engine: createGrid, gridToText, textToGrid, stampComponent (place a preset), setChar, eraseRegion, elementAt (hit detection), pxToCell |
| `src/lib/presets.js` | Component presets (button, input, box, divider, text), category grouping |
| `src/lib/history.js` | Undo/redo via reducer pattern |
| `landing/index.html` | Marketing landing page, hero, demo, app links |
| `landing/engine.js` | Canvas engine (same as src/lib/engine.js, used for demo) |
| `landing/presets.js` | Component presets (same as src/lib/presets.js) |
| `landing/devices.css` | Device frame CSS for responsive screenshots |
| `public/sw.js` | Service worker, network-first for pages, cache-first for hashed assets |
| `scripts/build-site.sh` | Composes final Pages site: landing at `/`, app at `/app` |

## iOS and macOS

| File | What it owns |
|---|---|
| `ios/App/BlockFrameApp.swift` | App entry point, scene setup, default window size (1000x760) |
| `ios/App/ContentView.swift` | Three-pane layout (toolbar/canvas/inspector), same logic as web |
| `ios/App/CanvasView.swift` | Canvas rendering as monospace Text (one per row), tap handlers for placement |
| `ios/App/Toolbar.swift` | Not shown in digest; component palette button grid |
| `ios/App/Inspector.swift` | Not shown in digest; selected element inspector (position, size, text) |
| `ios/App/Engine.swift` | Canvas engine ported from JS (line-for-line diffable), grid operations, hit detection |
| `ios/App/Presets.swift` | Component presets ported from JS, same shapes and sizes as web |
| `ios/App/Store.swift` | On-device persistence: canvas.txt in Application Support folder, survives relaunch |
| `ios/App/Theme.swift` | Warm-paper color tokens (paper bg #EFEDE6, ink text, terracotta accent #D97B6D) |
| `ios/Checks/main.swift` | Engine + presets self-check (ported from JS tests), compiled with `swiftc` standalone |

## KMP (Kotlin Multiplatform)

| File | What it owns |
|---|---|
| `kmp/shared/src/commonMain/kotlin/com/nulljosh/charwork/Engine.kt` | Canvas engine ported from JS/Swift, grid operations, stampComponent, elementAt |
| `kmp/shared/src/commonMain/kotlin/com/nulljosh/charwork/Presets.kt` | Component presets ported from JS, kept line-comparable for diffing |
| `kmp/shared/src/commonTest/kotlin/com/nulljosh/charwork/EngineTest.kt` | Unit tests for engine (grid-to-text, stamp, hit detection) |
| `kmp/composeApp/src/commonMain/kotlin/com/nulljosh/charwork/AppScreen.kt` | Shared Compose UI |
| `kmp/composeApp/src/androidMain/kotlin/com/nulljosh/charwork/MainActivity.kt` | Android entry |
| `kmp/composeApp/src/desktopMain/kotlin/com/nulljosh/charwork/Main.kt` | Desktop window setup |

## API and MCP

| File | What it owns |
|---|---|
| `functions/api/[[route]].js` | REST API router, dispatches to callTool in `src/lib/tools.js` |
| `functions/mcp.js` | Stateless MCP over HTTP, JSON-RPC transport for Claude integration |

## Landing page

| File | What it owns |
|---|---|
| `landing/index.html` | Marketing landing, app description, screenshots in device frames, app store links |

## Build and deployment

| File | What it owns |
|---|---|
| `scripts/build-site.sh` | Vite build + landing composition, publishes to Cloudflare Pages |
| `Package.swift` | TUI build target (terminal reference app) |

## Gotchas

**Single-pane monospace grid**: Canvas is drawn as monospace Text, one row per Text() call (50 rows, not 5,000 cells) for performance. Font advance is uniform, so whole-line draw aligns cell boundaries with tap-math pxToCell.

**Ported engines must stay diffable**: `src/lib/engine.js`, `ios/App/Engine.swift`, and `kmp/shared/src/commonMain/kotlin/com/nulljosh/charwork/Engine.kt` are kept line-comparable across languages. Function signatures, variable names, and logic order are maintained so changes can be ported easily.

**Presets also diffable**: same as engines, all three Preset definitions (JS, Swift, Kotlin) are kept in sync manually, never auto-generated.

**Warm-paper theme is separate**: `src/tokens.css` imports Jaybulb portfolio tokens, then `src/index.css` redefines them with warm-paper overrides (paper bg, ink text, terracotta). Do not merge into shared tokens.

**No cloud sync**: grid state is device-local only (localStorage on web, Application Support on iOS/macOS, UserDefaults/SharedPreferences on KMP platforms).

**Character grid is 100x50**: default size, hardcoded in engine. Resizable via UI but stored as-is.

**Preset IDs are opaque**: preset.id is the key for exports/imports, must not change. Only label and template can be edited.

**Text export is plain ASCII**: no metadata, no metadata file needed. The grid IS the export.
