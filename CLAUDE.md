# Formwork web

v1.1.0, Unicode wireframe tool. Vite + React 19. Warm paper design.

Renamed from Charwork 2026-09-10 (web, docs, GitHub repo). The Xcode project,
Kotlin package (`com.nulljosh.charwork`), watchOS/TUI targets, live App Store
Connect record (6794988951), and `charwork.heyitsmejosh.com` DNS still say
Charwork/Wiretext -- native scheme is still `Charwork-iOS` below. That's a
separate migration (bundle IDs and ASC name availability aren't a text sweep),
tracked in `roadmap.md`.

## Run

```bash
npm install && npm run dev   # dev server on :5173
npm run build                # production build
```

## Key Files

- `src/lib/presets.js`: 23 component templates (Button through Skeleton)
- `src/lib/engine.js`: grid state, stampComponent, undo/redo, pxToCell
- `src/App.jsx`: root reducer (SELECT_PRESET, PLACE_COMPONENT, UNDO, REDO, CLEAR)
- `src/components/Canvas.jsx`: HTML canvas, monospace char grid, hover preview, click-to-place
- `src/components/Toolbar.jsx`: component palette grouped by category
- `src/components/Inspector.jsx`: cursor coords, preset preview, history counts

## Design

Warm paper: `#FAF9F5` ground, `#F0EEE6` canvas, `#191919` ink, terracotta `#D97757`
accent, 10px corners. System sans throughout, monospace only inside the character
grid. Light and dark, toggled in the header (persists as `wiretext-theme` in
localStorage -- the key predates the rename and changing it would silently reset
everyone's preference).

Formwork **deliberately does not track the portfolio.** It still imports the shared
Jaybulb `tokens.css`, but `src/index.css` overrides the canonical `--color-*` names
so this app matches its own iOS app instead of the estate's yellow-on-white. That
override is the one sanctioned exception to the "never shadow the design system"
rule in that file -- add to it, don't add a second palette elsewhere.

`src/components/Canvas.jsx` reads its fill colours out of those custom properties at
draw time, so the `<canvas>` repaints from the tokens with no JS change.

## iOS

Native SwiftUI app in `ios/` (xcodegen), **iOS and macOS** from one target via
`supportedDestinations` since 2026-08-30. Rewritten from a WKWebView shell 2026-08-17, Apple's
Guideline 5.6 notice cited quality/completeness, and the 72-line shell was the finding. No web
assets are bundled any more; `npm run build:ios` is no longer part of the iOS build.

- `App/Engine.swift`: grid + undo/redo, ported function-for-function from `src/lib/engine.js`
- `App/Presets.swift`: the same 23 templates as `src/lib/presets.js`
- `App/CanvasView.swift`: SwiftUI `Canvas`, one Text draw per row (not per cell). Measures
  with CoreText, not `UIFont`: `NSFont` has no `lineHeight`, so CTFont is the one metric API
  that compiles on both platforms without a `#if`.
- `App/Store.swift`: canvas persists to Application Support, survives relaunch
- `Checks/main.swift`: the JS test suite ported as plain asserts

```bash
cd ios && xcodegen generate
xcodebuild build -scheme Charwork-iOS -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/dd-charwork -skipPackagePluginValidation

# macOS. No Mac provisioning profile exists for com.nulljosh.wiretext yet, so a signed
# build needs -allowProvisioningUpdates; this compiles and runs it without one.
xcodebuild build -scheme Charwork-iOS -destination 'platform=macOS' \
  -derivedDataPath /tmp/dd-charwork-mac -skipPackagePluginValidation \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""

# engine self-check, no framework needed
swiftc -o /tmp/wtcheck ios/App/Engine.swift ios/App/Presets.swift ios/Checks/main.swift && /tmp/wtcheck
```

Two entitlements files, split by SDK. A single shared file compiles fine but cannot SIGN a Mac
build: `application-identifier` is not a valid macOS entitlement and profile creation fails.

Native-only capabilities the web build cannot offer: on-device persistence, the system share
sheet, and hardware-keyboard undo/redo (⌘Z / ⇧⌘Z).

Keep `Engine.swift`/`Presets.swift` in sync with their `src/lib/` counterparts, the ports are
deliberately line-comparable.

## HTTP API + MCP

Cloudflare Pages Functions in `functions/`, added 2026-08-30. `src/lib/tools.js` is the one
definition both surfaces call, add tools there, never in a handler.

- `GET /api/components`, `POST /api/place`, `POST /api/render`
- `POST /mcp`: JSON-RPC, stateless, no SDK and no Durable Object

Unlike `src/lib/webmcp.js` (stateful, drives the live canvas, has `undo`) these are pure
transforms: wireframe in, wireframe out. That is what keeps them free of a database. Full
detail in `docs/API.md`.

```bash
npx wrangler pages dev    # needs wrangler.toml's pages_build_output_dir, not `deploy dist`
```

## Architecture

- `state.grid: string[][]`: 100x50 2D char array
- `stampComponent(grid, template, col, row)`: immutable stamp
- `gridToText(grid)`: joins for export/copy
- Canvas renders via `<canvas>` 2D context (not DOM/pre)
- Undo stack: 50 steps max, stored as grid snapshots

## Notes

- No external deps beyond React; the backend is Pages Functions only, with no storage
- Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y redo (canvas must be focused)
- Export writes `wireframe.txt` via Blob URL
