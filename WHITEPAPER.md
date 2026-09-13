# Blockframe Technical Whitepaper

**v1.1.0** | August 2026

Wireframes made of characters.

A wireframe is usually a PNG, and a PNG cannot go in a commit message, a code
comment, or a plain-text chat without an attachment. Blockframe fixes that by
making the wireframe itself text: pick a component, stamp it on a monospace grid, copy the result as text. It pastes
into a commit message, a code comment, a chat. No image anywhere, because the whole point is a wireframe that travels as easily as the words around it. Live at
[wiretext.heyitsmejosh.com](https://wiretext.heyitsmejosh.com).

## Core Mechanic: The Character Grid

The document is `state.grid: string[][]`, a 100×50 2D array of characters.
Everything is a pure function over that array, because a document that is
just a grid of characters can be reasoned about, tested, and undone without
any of the complexity a real canvas library brings:

- **Components**: 23 presets (`src/lib/presets.js`), Button through Skeleton,
  each a small template of box-drawing characters.
- **Stamping**: `stampComponent(grid, template, col, row)` returns a new grid
  with the template written in; the reducer never mutates. Immutability makes
  undo/redo (50 steps) a matter of keeping old grids rather than tracking
  reverse operations by hand.
- **Export**: `gridToText(grid)` joins rows into the final plain-text
  wireframe for `.txt` download or clipboard copy.

The canvas (`src/components/Canvas.jsx`) renders the grid to an HTML canvas in
a monospace font, converts pointer position to cells via `pxToCell`, and shows
a hover preview of the selected component before placing.

## Architecture

- **Stack**: Vite 6 + React 19, no external UI libraries.
- **State**: one root reducer in `App.jsx` (SELECT_PRESET, PLACE_COMPONENT,
  UNDO, REDO, CLEAR).
- **UI**: `Toolbar.jsx` (palette grouped by category), `Inspector.jsx`
  (cursor coords, preset preview, history counts).
- **Design**: dark-mode only, exact portfolio tokens from
  warm paper (#FAF9F5 bg, #D97757 accent, system sans). The shared
  tokens.css is still imported, then overridden in `src/index.css` -- Blockframe
  matches its own iOS app rather than the portfolio.

## iOS

Native SwiftUI (xcodegen), rewritten in August 2026 from the original
WKWebView shell after Apple's Guideline 5.6 flagged it as too thin to be its
own app. The shell had to serve its build over a custom `app://`
scheme because ES module scripts are blocked cross-origin under `file://`;
the native port removed that workaround along with the embedded web build,
trading a browser-in-a-box for a real native document. Remaining before App Store submission: generate an AppIcon asset catalog from
`icon.svg`.

## Privacy

Fully client-side, because a wireframe someone is sketching before a real
product exists is not something worth putting behind a login. No accounts, no network calls, no storage beyond the
in-memory grid, close the tab and the document is gone unless exported.
