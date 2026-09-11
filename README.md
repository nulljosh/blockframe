<img src="icon.svg" width="80" style="border-radius:18px">

# Blockframe
![version](https://img.shields.io/badge/version-v1.1.0-blue)
![license](https://img.shields.io/badge/license-MIT-green) [![GitHub](https://img.shields.io/badge/GitHub-nulljosh%2Fblockframe-black?logo=github)](https://github.com/nulljosh/blockframe)

Wireframes made of characters.

Pick a component. Stamp it on a monospace grid. Copy the result as plain text. It pastes into a commit message, a code comment, a chat. No image, no export dialog, no design tool.

## Screenshots

<p>
<img src="screenshots/ios/en-US/01-canvas-65.png" width="300" alt="Blockframe">
</p>

## Run

```bash
npm install && npm run dev
```

## Features

- 23 component presets: Button, Input, Select, Checkbox, Radio, Toggle, Table, Modal, Browser, Card, Navbar, Tabs, Progress, Icon, Image, Divider, Alert, Breadcrumb, Avatar, List, Stepper, Rating, Skeleton
- Click to place on a 100×50 character grid
- See it before you place it
- Export `.txt` or copy to clipboard
- Undo and redo, 50 steps deep
- Zinc dark theme, Inter, indigo accents

## Architecture

![architecture](architecture.svg)

## Stack

Vite 6 and React 19. No UI libraries.

## License

MIT 2026 Joshua Trommel

## Live

[wiretext.heyitsmejosh.com](https://wiretext.heyitsmejosh.com)

**Terminal:** `swift build && ./.build/debug/blockframe-tui` — see [tui/](tui/)

## Whitepaper

[Technical whitepaper](WHITEPAPER.md)

## API and agent tools

An agent can drive this app. [`docs/API.md`](docs/API.md) lists the HTTP surface, where there
is one, and the WebMCP tools registered on `document.modelContext`. Tools come in three kinds:
read-only, writes you can undo, and the few that ask a human first.

## Apple Watch

Standalone watchOS companion in `watchos/` (xcodegen), added 2026-09-02. Same 23 presets and
grid engine as the iOS app — `Models/Engine.swift` and `Models/Presets.swift` are ports of
`ios/App/Engine.swift`/`Presets.swift`, sized down to a 28x14 grid to fit a watch face. It has
no backend to call and no App Group shared with the iPhone app, so it's a fully independent
wireframe tool with its own on-device persistence, not a viewer for iPhone data.

```bash
cd watchos && xcodegen generate
```
