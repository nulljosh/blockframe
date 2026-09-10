# Wiretext Roadmap

## Decision 2026-09-10: toward a real canvas editor, not a stamp tool

Direction: move Charwork from "stamp a preset into a fixed char grid" toward something
closer to Claude Design's canvas editor -- selectable/movable/resizable elements, a
properties panel, inline text edit, multiple artboards.

**Phase 1 shipped (web only, commit f776d13):** engine.js gained an `elements` array
(id/position/size/template) that renders into the grid instead of being baked in
one-way. Click to select, drag to move, Delete/Backspace or Inspector button to
remove. Undo/redo now snapshots elements, not raw grids.

**Not done yet, in rough order:**
- [ ] Resize (drag corner/edge handles)
- [ ] Inline text editing on placed elements (type to relabel, not just position)
- [ ] Multi-artboard (several canvases on one pan/zoom surface)
- [ ] Port element model to `ios/App/Engine.swift` (currently still grid-bake only,
  kept function-for-function with the old `src/lib/engine.js` -- now diverged)
- [ ] Update `src/lib/webmcp.js` / `src/lib/tools.js` MCP surface if agents need to
  select/move/delete elements, not just place them

**Naming:** current name "Charwork" doesn't fit a real canvas-editor product as well
as it fit a wireframe-stamp tool. Candidate: **Formwork** (temporary structure that
shapes a permanent one -- fits the wireframe-to-real-UI arc). Not yet ASC-probed --
the throwaway probe record (6783501927) that `asc-name-creator`'s `probe.sh` defaults
to no longer exists, need a fresh parked app id before checking availability. Do not
apply until probed; App Store name rejections are exact-match and only found by
attempting them.

- [ ] Verify iPad layout visually on simulator -- 2026-09-02. Code review found no
  structural iPad issue (full-bleed canvas tool, `TARGETED_DEVICE_FAMILY = "1,2"` already
  set, no NavigationStack/list-detail pattern to convert), but this machine's Xcode only
  has the iOS 26.5 SDK with the iOS 26.2 runtime downloaded, so `xcodebuild` won't
  recognize any simulator destination even by explicit UDID. Needs the matching platform
  component installed, then a screenshot check (portrait + landscape).

## App Review rejection reason, READ FROM RESOLUTION CENTER 2026-08-12

**Guideline 5.6, Developer Code of Conduct, Review Suspended.** Not an app-specific
defect. Verbatim: *"the current submission does not meet the required quality standard for
distribution on the App Store... this app is not eligible for resubmission before August
18th, 2026. Replies and resubmissions before this date will not be reviewed."*

Apple's listed next steps before resubmitting: no placeholder/unfinished/unrefined content;
every screen reviewed and tested; stable across **all** supported devices (iPad included if
the app is offered there); and **detailed notes of the improvements made** in the App Review
Information → Notes field. Continued similar submissions are warned as grounds for removal
from the Developer Program.

This hit 4 apps at once on 2026-08-09: curvely, nyc, transcriptly, wiretext.

Source: `asc web review show --app 6794988951 --apple-id trommatic@icloud.com` (needs `asc-login`;
the public API only returns a generic "unresolved issues" wrapper). Submissions frozen
The freeze lifted 2026-08-18; submission is now gated only on the four in-flight review verdicts.

## ASC state VERIFIED 2026-08-12 (`asc versions list`)

**iOS 1.0 is `REJECTED`**, the section below says WAITING_FOR_REVIEW. Submission
`27425fb8…` came back rejected. Reason is Resolution-Center-only (needs `asc-login`).

Separately, a real defect found 2026-08-12: `ios/Wiretext.entitlements` exists but
`ios/project.yml` never sets `CODE_SIGN_ENTITLEMENTS`, so xcodegen drops it and every build
ships without `application-identifier` (ITMS-90886, TestFlight-ineligible). It *looks*
fixed and is not. Proven fix to copy: `curvely/ios/project.yml`. This target also lacks
`DEVELOPMENT_TEAM`, `CODE_SIGN_STYLE`, and an AppIcon catalog.

Freeze lifted 2026-08-18 (Guideline 5.6 suspension expired). Submitted that day and now
WAITING_FOR_REVIEW: Curvely iOS 1.2.0, Wiretext iOS 1.1.0, Wordroot iOS 1.0, Healstack iOS 2.3.4.
**Held pending those four verdicts, never a batch:** Sparkjar iOS+Mac, BCGD iOS+Mac, Wordroot Mac,
Lexly Mac. All six are `asc validate` clean (0 errors, 0 blocking) with a VALID build attached, so
each is one `asc review submit` away. Do not submit until the in-flight verdicts land.

## Shipped 2026-08-03, iOS 1.0 SUBMITTED (WAITING_FOR_REVIEW)

Review submission `27425fb8-9404-42a0-88bf-ec85773ed696`, submitted 2026-08-03T17:25Z, on build `1ed73f24` (uploaded 07-29, VALID). `asc review doctor` went from **34 blocking errors to 0**. What was set this pass, all via CLI:

- Age rating (`asc age-rating edit --all-none`), content rights, copyright, review contact details (demo account flag cleared, app needs no login)
- Description / keywords / support + marketing URL; subtitle + privacy policy URL via new canonical `metadata/` dir (`asc metadata pull/plan/apply`), this repo had no ASC metadata wiring at all before
- Categories: primary DEVELOPER_TOOLS, secondary GRAPHICS_AND_DESIGN → age rating resolved to 4+
- App Privacy: DATA_NOT_COLLECTED applied + published
- Non-exempt encryption set false on the build, and `ITSAppUsesNonExemptEncryption` added to `ios/App/Info.plist` so future builds never re-trip it
- Screenshots: iPhone 6.5" (1242x2688) + iPad Pro 12.9" (2064x2752), captured on sim via AXe-driven taps building a real wireframe (browser, navbar, card, table, list, button, input, tabs, alert) rather than an empty canvas. `TARGETED_DEVICE_FAMILY "1,2"` means iPad shots are mandatory.
- Free price schedule (was the last hidden gate, `asc review doctor` does NOT check pricing, but `review items add` fails with "App is not eligible" without it)

### Two CLI findings worth reusing on every other app

1. **The "app availability is dashboard-only" dead end is FALSE.** `asc pricing availability create` works, but `asc pricing territories list` defaults to a 50-item page, and the CLI then builds a payload referencing territories it never fetched, failing with a misleading `expects an included resource ... id 'ROU' but no matching resource was included` (it errors on ROU even when you pass only `--territory USA`). Fix: fetch with `--limit 200` (175 territories) and pass all of them:
   `asc pricing availability create --app <ID> --territory "<all 175 ids>" --available true --available-in-new-territories true`
   This should unblock availability on curvely, healstack, nyc, portfolio and anything else stuck on it.
2. **App Privacy publish returns a bare 409** until you `asc web privacy apply --file <declaration.json> --confirm` first; publish alone never works on a fresh app.

## Blocked on Joshua
- [ ] **Icon uses teal (#39CCCC viewfinder motif)**, which contradicts the standing "no teal, no purple" rule. Not changed here on purpose: the icon is baked into build `1ed73f24`, which is currently under review, swapping it means a new build and a resubmit. Decide after the review clears whether to redesign.
- [ ] **Orange accent removal** (wiki lists this for wiretext + Talli + Curvely together). The orange is the canvas cursor box, visible in the App Store screenshots. Same reason as above, deferred until the current review resolves, since it needs a rebuild + new screenshots.

## WKWebView shell (reviewed 2026-07-22)
Not a gap, `CLAUDE.md` documents this as intentional ("app has no native API needs"). Unlike Books, this was a deliberate choice, not an oversight. Revisit only if wiretext ever needs a real native API. If it's ever ported anyway: no real blockers (grid/undo logic and 23 presets are plain data, map cleanly to SwiftUI), could also resolve the still-open blank-white-screen sim bug above as a side effect.

## Decision 2026-08-04

- [ ] Rename wiretext -> **Charwork** (approved 2026-08-04, deliberately parked - "we can work on it later", not urgent). Reason: current name was copied from the source idea. Charwork says what it is (character-grid canvas). Touches: repo name, Cloudflare Pages project, `wiretext.heyitsmejosh.com` DNS, App Store Connect record, in-app title/manifest. Do as one deliberate pass, not a drive-by. Rejected alternatives: Gridling, Plotline.

## App Store submission freeze, LIFTED 2026-08-18
Freeze lifted 2026-08-18 (Guideline 5.6 suspension expired). Submitted that day and now
WAITING_FOR_REVIEW: Curvely iOS 1.2.0, Wiretext iOS 1.1.0, Wordroot iOS 1.0, Healstack iOS 2.3.4.
**Held pending those four verdicts, never a batch:** Sparkjar iOS+Mac, BCGD iOS+Mac, Wordroot Mac,
Lexly Mac. All six are `asc validate` clean (0 errors, 0 blocking) with a VALID build attached, so
each is one `asc review submit` away. Do not submit until the in-flight verdicts land.

## Decision 2026-08-10: keep the record, build the app out
Not withdrawing. The App Store record (6794988951) stays; it just goes dormant until the app is
real. Payments/IAP alone will NOT clear Guideline 4.2, 4.2 is about what the app *does*, and a
paid WebView wrapper is still a wrapper.
- **CLOSED 2026-08-25** (done, the freeze lifted, it was resubmitted, and iOS **1.1.0 is READY_FOR_SALE**, verified via `asc versions list --app 6794988951`). Was: Do not resubmit until it is past 2026-08-18. Functionality condition met. **Tried 2026-08-17 and it is blocked until the unfreeze:** `asc versions create --app 6794988951 --version 1.1.0` fails with "You cannot create a new version of the App in the current state", the only version, iOS 1.0, is REJECTED and the app is still inside the 5.6 suspension window. Retry the create on Aug 18; if it still refuses, the fallback is editing the existing rejected version's version string rather than creating a new one.

## 2026-08-10, App Review notes are EMPTY
`asc review details-for-version` shows no App Review notes on Wiretext's version. Apple's 5.6
letter explicitly requires "detailed notes of the improvements made" before resubmission.

> Resume note (2026-08-11): a `wip: partial work from /work notes ingest` commit holds unfinished, unverified changes for the items above. Review `git show HEAD` before building on it, it was committed mid-flight, not reviewed, and is unpushed.

## Guideline 5.6 resubmission checklist, prepared 2026-08-12, DO NOT SUBMIT BEFORE 2026-08-18

Apple's 5.6 notice makes one thing mandatory that is easy to miss: **"Include detailed notes
of the improvements made to the app in the Notes field of the App Review Information section."**
A resubmission without those notes is a wasted attempt, and 5.6 warns that repeat submissions
with the same issues can mean removal from the Developer Program.

The notes must describe improvements that were **actually made**. Nothing has been written into
ASC yet on purpose, there is nothing truthful to claim until the work below is done.

Before resubmitting:

- [ ] Fix something real, and write down what. No placeholder, unfinished, or unrefined content
      anywhere in the app.
- [ ] Walk every screen and interaction once, on device. 5.6 is a quality judgement, not a
      spec violation, the reviewer decided the app felt unfinished.
- [ ] Test on **every** device family the app is offered on. If `TARGETED_DEVICE_FAMILY` is
      `"1,2"` the app must be genuinely good on iPad, not merely launchable. Narrowing to
      iPhone-only is a legitimate alternative to making iPad good.
- [ ] Confirm a non-empty "What's New" (`asc metadata push`).
- [ ] Then write the improvement notes:
      `asc review details-update --id 79348adb-3187-44bf-a543-495be8f6da2c --notes "..."`
- [ ] Only then submit. Review detail id for this version: `79348adb-3187-44bf-a543-495be8f6da2c`.

## 5.6 defect verification 2026-08-18

**Verdict: cited defect disproven as still-present, it was fixed before the resubmission.**

- iOS 1.1.0 is `WAITING_FOR_REVIEW` (submitted ~04:06 today), build `202608180348` uploaded
  03:51, VALID.
- Apple's actual 5.6 complaint was minimum functionality, "Wiretext is 1 Swift file / 72 lines
  … still a WKWebView shell" (`ship-plan.md`). Current `ios/App/` is 542 lines across 8 Swift
  files (`Engine.swift` 127, `ContentView.swift` 135, `Presets.swift` 115 …) plus a 155-line
  `Checks/main.swift`. **No WebKit anywhere in the sources.**
- "No landing page" (2026-08-18 Notes review) no longer holds: commit `0a703b2` added a
  marketing landing page at `/` and moved the app to `/app`. `wiretext.heyitsmejosh.com` → 200
  (title "Wiretext, wireframes made of characters"), `/app` → 200.
- Registered ASC marketing + support URLs are both `https://wiretext.heyitsmejosh.com`, live.

No code change was needed. Do not submit anything further until this review clears.

## Ingested 2026-08-24

- [ ] **Hero animation pass** (Notes 2026-08-24). Josh: "Curvely and wiretext can get this treatment too, however you decide." Reference: bookrank's hero animation, copy its style and vibe, subject is Wiretext's own char-grid canvas.

## From Notes (imported 2026-08-27)
- [ ] **ASC rename is blocked and needs a version submission.** `asc metadata apply` failed with `The field 'name' can not be modified in the current state` (app-info) and `Attribute 'description' cannot be edited at this time` (version). iOS 1.1.0 is READY_FOR_SALE and there is no editable version, so Apple will not take a name change until a new version is created and submitted for review. That is deliberately not done while the account-level Guideline 4.3(a) wave is open. When the appeal clears: create the next version, then `asc metadata plan/approve/apply --app 6794988951 --version <new>`, the canonical files already say Charwork, so it will apply cleanly. ASC record 6794988951 still reads "Wiretext" until then.

### Rename shortlist, probed 2026-08-27, authoritative

Probed with `asc-name-creator/probe.sh` against throwaway record 6783501927, which is
exact-match truth (the iTunes Search API and every public checker are wrong the same way).
`nulljosh/<name>` on GitHub is free for all six leaders. **Trademark screening was NOT done.**

**AVAILABLE (13):** Charwork · Charcast · Glyphra · Glyphdraft · Boxdraw · Blockframe ·
Cellwright · Cellwire · Runeframe · Monodraft · Wireglyph · Textframe · Sketchcell

**TAKEN (9):** Charta · Asciify · Gridle · Gridwright · Stencil · Lattice · Typewire ·
Framewright · Draftbox

**Charwork is confirmed still available**, the wiki records it as already approved on
2026-08-04 and then parked ("will rename the app, repo, domain, and bundle ID"). Unless
that decision changed, Charwork is the default and this shortlist is just the alternates.

When a name is picked, the rename is more than the ASC listing: `asc apps rename --app
6794988951`, then `INFOPLIST_KEY_CFBundleDisplayName` in `ios/project.yml` + `xcodegen
generate` (the app is **native SwiftUI since 2026-08-17**, so the rename touches the Swift
target as well as the web app), README/CLAUDE.md/landing `<title>`, the row in
`~/Documents/Code/CLAUDE.md`, the GitHub repo, and the
`wiretext.heyitsmejosh.com` subdomain.

- [ ] **Joshua: pick a name from the shortlist above** (or confirm Charwork), then run the propagation sweep.
- [ ] Housekeeping: probe record 6783501927 is currently named **"Headwire"**, not "Lexly Mac", a leftover from an earlier probe run whose restore did not complete. Harmless (probe.sh saves and restores whatever it finds, and did so correctly today), but the record is the one memory says needs Apple Support to delete.

### Design pass 2026-08-27, web app now actually consumes the design system

Root cause of "doesn't match the other projects": `src/index.css` imported the shared
tokens and then **re-declared the colours they own**, so the design system was loaded and
immediately shadowed. Fixed by making that block a pure alias layer onto the Jaybulb tokens.

Real bugs found and fixed on the way:
- `font-family: var(--font)` was used in 7 places and **no stylesheet anywhere defined
  `--font`**, every one of those elements was silently falling back to the browser default,
  which is serif on most browsers. Now aliased to `--font-body` (SF/Helvetica).
- `--font-mono` named 'Berkeley Mono', 'JetBrains Mono', 'Fira Code', none of which this
  repo ships. Now `--font-code` from the tokens. Monospace is kept for the character grid
  only; that grid is the product, and the chrome around it is sans.
- The dark theme only redefined `--surface`/`--surface2`; `--bg`, `--muted` and `--subtle`
  stayed at their light values, so parts of dark mode were ink-on-ink. Aliasing fixes it,
  because the tokens are theme-aware and these no longer are.
- `.btn-primary` set `color: #fff` on `background: var(--accent)`. With the accent now the
  bulb (#ffca30) that is unreadable, so primary buttons are black-on-bulb, the design
  system's actual signature. It cannot be `--color-text`; the bulb stays yellow in dark mode.
- Squared every corner (`--radius`, the system is square everywhere) and dropped the three
  `0 -4px 20px` mobile sheet shadows to `--shadow-md` (a no-op; the system uses flat blocks).
- `src/components/Canvas.jsx` drew in hardcoded hexes including the orange cursor `#FF851B`
  and an orange hover preview. These now read `--accent`, `--color-text`, `--color-bg2`,
  `--color-hairline` and `--color-secondary` off the tokens at draw time, so the canvas
  follows the theme instead of fighting it. **This closes the web half of the "orange accent
  removal" item under "Blocked on Joshua"**, the iOS build and the teal icon are untouched
  and still need Joshua's decision, since those are what appear in the App Store screenshots.

Verified: `vite build` clean (built to a temp dir, `scripts/build-site.sh` opens with
`rm -rf dist` and `dist/` is tracked), 26/26 existing tests pass, and the built CSS contains
no serif, no Berkeley Mono, and no teal/purple/indigo/orange.

### Someday / Explore
- [ ] The bulb (#ffca30) is a low-contrast colour for a 1px cursor outline on a near-white
      canvas. It is drawn at `lineWidth: 2` now to compensate, but if it reads as faint in
      real use the cursor may want a solid bulb block behind the cell instead of an outline.
- [ ] `src/App.css` still carries `#ef4444` for the danger button. Left alone deliberately , 
      it is semantic (destructive), not brand, and the token set has no danger colour.

## Web design (2026-08-28)

Charwork's web now uses the warm paper palette from its iOS app, overriding the
shared Jaybulb tokens in `src/index.css`. It deliberately no longer matches the
portfolio. Deployed and live on both domains.

- [ ] The canvas grid dots are very faint against the paper ground -- readable,
      but harder to judge alignment than on the old cream. Darken a step if it
      annoys in real use.
- [ ] Cursor Col/Row lives only in the far-right Inspector, so placing a
      component means looking across the whole window. A readout near the cursor
      would be less eye travel.
- [ ] The Inspector panel is four rows of data in a full-height column. Either
      give it more to do or let the canvas have the space.
- [ ] The welcome modal's scrim is `rgba(0,0,0,0.6)` -- cold and heavy against
      the warm palette; a lighter warm scrim would suit.

- Upload the refreshed App Store screenshots (`ios/screenshots/` in curvely, `screenshots/` in charwork) with the next version bump, the live listing still shows the pre-rebrand shots, and screenshots can only change on a new, editable version. 2026-08-31

## TUI pilot (2026-09-05)
- `charwork-tui` SwiftPM target (SwiftTUI). `swift build && ./.build/debug/charwork-tui` fetches /api/components and lists the palette with ASCII templates. Needs a real TTY.
