# State of the project

**Single source of truth for what is built, what is next, and what is blocked.**

Read this before starting any work. Update it before finishing any work. That rule is
binding on every session and is restated in `CLAUDE.md`.

This file tracks **specs** — units of work. `BACKLOG.md` tracks **tasks** inside a spec,
and `PROGRESS.md` records what each session actually did. Three files, three altitudes.
Do not merge them.

`CONTEXT.md` outranks this file. If they disagree, `CONTEXT.md` wins and this file is wrong.

---

## Status legend

| State | Meaning | Who moves it |
| --- | --- | --- |
| `SPEC PENDING` | Titled and scoped here, but the spec file in `specs/` does not exist yet, and at least one dependency is not `DONE`. | Whoever writes the spec |
| `READY TO GO` | Spec file written and approved. Blocked — at least one dependency is not `DONE`. | Automatic, when a dependency lands |
| `READY FOR DEVELOPMENT` | Every dependency `DONE`. Claimable right now. The claiming session writes the spec file first if it does not exist. | Automatic, when the last dependency lands |
| `IN PROGRESS` | A session has claimed it. Only one spec may be `IN PROGRESS` at a time. | The claiming session |
| `DONE` | Every acceptance criterion in the spec verified. `npm run build` and `npx tsc --noEmit` both pass. | The finishing session |

A spec may only move to `DONE` with a green build. Anything less goes back to
`READY FOR DEVELOPMENT` and the reason goes in `BLOCKED.md`.

**On who writes the spec file.** An earlier reading of this legend deadlocked the project:
nothing could be claimed until a spec file existed, and no session was assigned to write one.
`prompts/02-ralph-loop.md` settles it — the session that claims a spec writes
`specs/<n>-<name>.md` from the title and description below, before writing any code. So a
spec is claimable on its dependencies alone. Phase B is not a separate pass; it happens one
spec at a time, inside the session that builds it.

---

## Phase status

| Phase | What | State |
| --- | --- | --- |
| A | Research the node registry → `data/nodes.json`, `data/tracks.json` | `DONE` — 2026-08-18 |
| B | Write the specs → `specs/*.md` | `DONE` — 2026-08-19; folded into each spec's own session, 12 of 12 written |
| C | Build the backlog → `BACKLOG.md` | `IN PROGRESS` — `BACKLOG.md` created 2026-08-18, appended per session |

---

## Spec board

| # | File | State | Depends on |
| --- | --- | --- | --- |
| 01 | `specs/spec-01-schema.md` | `DONE` | — |
| 02 | `specs/spec-02-shell.md` | `DONE` | 01 |
| 03 | `specs/spec-03-intake.md` | `DONE` | 01, 02 |
| 04 | `specs/spec-04-path.md` | `DONE` | 01, 02 |
| 05 | `specs/spec-05-cards.md` | `DONE` | 01, 04 |
| 06 | `specs/spec-06-panel.md` | `DONE` | 01, 05 |
| 07 | `specs/spec-07-character.md` | `DONE` | 04 |
| 08 | `specs/spec-08-progress.md` | `DONE` | 04, 05, 07 |
| 09 | `specs/spec-09-frontier.md` | `DONE` | 04, 05 |
| 10 | `specs/spec-10-navigation.md` | `DONE` | 04, 08, 09 |
| 11 | `specs/spec-11-portability.md` | `DONE` | 08 |
| 12 | `specs/spec-12-ship.md` | `DONE` | 01–11 |
| 13 | `specs/spec-13-visual-overhaul.md` | `DONE` | 01–12 |
| 14 | `specs/spec-14-completion-payoff.md` | `DONE` | 01–13 |
| 15 | `specs/spec-15-ai-engineering-branch.md` | `IN PROGRESS` | 01–14 |

Every spec 01–13 was `DONE` and the board was finished. On 2026-08-20 the project owner opened
spec 14 directly, in conversation, after reviewing a real local build and giving explicit
direction: keep the paper-roadmap identity, add reward feedback on top of it. See spec 14's
own "Why this spec exists" for the full account, including the separate GitHub Pages
deployment fault this session found and logged rather than folded into the spec.

Spec 14 landed `DONE`, and in the same conversation the owner opened spec 15: the registry's
content doesn't cover what reference "AI Engineer" roadmaps lead with (RAG, vector databases,
agent frameworks, evals, local models), and was told directly to close that gap. See spec 15's
own "Why this spec exists" for the two reference roadmaps this session actually fetched and
compared against the registry, node by node.

**Read the amended section 8 of `CONTEXT.md` before touching any UI.** On 2026-08-19 the
project owner authorised the one edit that file has ever had: the visual identity moved from
*editorial dark terminal* to *paper roadmap*. Warm paper ground, ink road, four semantic paper
accents, one action accent, Gabarito + Space Grotesk + JetBrains Mono, and no serif. Spec 13
carried it through every screen. Dark-terminal styling anywhere in the tree is pre-spec-13
residue, not the constitution — restoring it would undo the spec.

---

## 01 — Types, schema, and data loading

**State:** `DONE` — 2026-08-18  **Depends on:** nothing

Defines `Node`, `Track`, `Act`, `Branch`, `Link`, `Level`, `Zone`, `Status`, `Kind` in
`src/types.ts`, plus a runtime validator and loader for `data/nodes.json` and
`data/tracks.json`. Every other spec imports from here and none of them redeclares a shape.

The validator is not decoration. It enforces what the registry generator already enforced:
no dangling `requires`, no main-zone node depending on a frontier node, no node placed on a
track before its prerequisite, every date-less node `emerging` and carrying a `note`.

**Watch for:** `status: "emerging"` is the majority state (42 of 67 nodes). It means
"freshness unknown", not "risky". Do not type it as an error condition.

### Session notes — 2026-08-18

**Built:** `src/types.ts` (type-only), `src/constants.ts`, `src/data/order.ts`,
`src/data/validate.ts` (32 rule codes, pure and total), `src/data/registry.ts` (loads,
validates once, throws `RegistryError`, exposes indexed lookups), `scripts/validate-data.ts`,
and the minimal Vite + React + TS toolchain. Real data validates with 0 errors and 0
warnings; a 45-case corruption suite confirms every rule code fires.

**Decided:**

- **Spec 01 owns the toolchain, spec 02 owns the look.** `package.json`, `tsconfig.json` and
  `vite.config.ts` had to land here because spec 01's own definition of done is "`npm run
  build` and `npx tsc --noEmit` pass", and neither command existed. **Spec 02 must not run
  `npm create vite`** — it inherits this scaffold and adds `theme.css`, the typefaces,
  Tailwind and the app frame on top.
- **`src/main.tsx` is a throwaway smoke test.** Unstyled semantic HTML printing registry
  counts, no class, no style attribute, no stylesheet, because `theme.css` does not exist
  yet. Spec 02 replaces its contents wholesale.
- **Reading order lives in exactly one file.** `src/data/order.ts` defines it — act by act,
  each act's own nodes then the nodes of every branch anchored in that act. Both the
  validator and the loader import it. A second implementation would let the map disagree with
  its own prerequisite checking, which is the same class of bug `CONTEXT.md` section 9 warns
  about for path positions. Do not inline this logic anywhere.
- **No `@types/node`.** `scripts/node-shims.d.ts` declares the five Node functions the CLI
  script uses, so the dependency list stays at exactly what `CONTEXT.md` section 10 allows.
  If a later spec needs materially more of the Node API, log the `@types/node` question to
  `BLOCKED.md` rather than growing that file.
- **No `tsconfig.node.json`.** A composite referenced project may not set `noEmit` (TS6310).
  `vite.config.ts` is in the single `tsconfig.json` include instead.

**Next session should know:**

- `npm run build` is now `validate:data && tsc --noEmit && vite build`. A registry that fails
  validation fails the build, verified by deliberately breaking a `requires` and watching it
  exit 1. `validate:data` needs **Node >= 22.6** for `--experimental-strip-types`; that is
  declared in `engines`.
- Imports inside `src/` and `scripts/` carry explicit `.ts` extensions
  (`allowImportingTsExtensions`). This is load-bearing: it is what lets plain Node run
  `scripts/validate-data.ts` against the same validator the browser uses. Keep writing them.
- `src/types.ts` must stay type-only — runtime values go in `src/constants.ts`. `constants.ts`
  already holds `LEVEL_RANK` for spec 03's level filter, `KINDS` in the display order spec 06
  should group links by, and the section 6 freshness thresholds spec 09 needs.
- `registry.getNode(id)` **throws** on an unknown id rather than returning `undefined`.
- `registry.tracks` and `registry.geometry` are the live imported JSON objects and are only
  `readonly` at the type level, not frozen. Do not mutate them.
- The registry is a hard stop, not a degraded render: if validation fails at runtime the app
  throws at module load and the page is blank with a console error. That is deliberate — a
  silently wrong map is worse than no map.
- The dev server logs one 404 for `/favicon.ico`. No favicon exists yet; that is a spec 02
  asset decision, deliberately not made here.
- `data/nodes.json` and `data/tracks.json` are untouched and byte-identical to commit
  `a787113`.

---

## 02 — Visual shell: theme, type scale, app frame

**State:** `DONE` — 2026-08-18  **Depends on:** 01

Vite + React + TypeScript scaffold. One `theme.css` holding every colour and type custom
property so the whole aesthetic is swappable in one file. Serif display face plus mono for
all structural text. Hairline rules, hard edges, generous emptiness.

Deliberately early. The aesthetic must be judgeable before a single system is built, because
rebuilding the look after the map exists is far more expensive than rebuilding it now.

**Watch for:** `CONTEXT.md` section 8 is a hard constraint, not a mood board. No gradients,
no glassmorphism, no glow shadows, no emoji icons, no default Tailwind palette tokens, no
Inter. Tailwind is for layout only.

### Session notes — 2026-08-18

**Built:** finished the work a prior session in this claim left mid-flight (theme tokens,
vendored fonts, and the Tailwind namespace resets in `index.css` were already committed).
Added `vite.config.ts`'s `tailwindcss()` plugin (installed but not wired), `src/styles/base.css`
and `src/styles/shell.css`, `src/components/Shell.tsx` and `Section.tsx`, replaced `App.tsx`
and `main.tsx` wholesale, added `src/assets.d.ts`, and gave `index.html` a description meta
and a `data:` icon.

**Decided:**

- `Section`'s `title` renders at `--size-display`, not `--size-title`, even though the type
  name suggests otherwise. `--size-title` sized the heading at only ~1.6–2.4× the body size
  depending on viewport, short of acceptance criterion 11's 3× floor; `--size-display` is the
  token `theme.css`'s own comment already promises "3.2x body at 360px and 5.9x at full
  width" for. Read `--size-title` as reserved for a *sub*-heading a later spec introduces
  inside a section (an act title, say) — nothing on this one screen needs it yet.
- The one accent hue is spent on exactly three things, matching acceptance criterion 13 by
  construction: `::selection`, the `:focus-visible` outline, and the track-row hover
  border-left. Verified by grepping `src/styles/` for `var(--accent`, not by eye.
- Track rows are static `<li>` — no `<a>`, no `<button>`, no `onClick`. Spec 03 owns
  selection; giving these affordances now would mean re-deciding their markup twice.
- Track-list and Section-heading CSS both live in `shell.css` rather than a separate
  `App.css`, because the spec's file list only names `theme.css`, `index.css`, `base.css`
  and `shell.css` — no fifth stylesheet. `shell.css` is the one components layer this spec
  owns.

**Verified:** `npm run build` 0, `npx tsc --noEmit` 0. `npm ls --depth=0` shows exactly the
spec 01 dependencies plus `tailwindcss` and `@tailwindcss/vite`. Grepped `src/`, `index.html`
for hex/`rgb(`/`hsl(`/`oklch(` (none outside `theme.css`), gradients/`backdrop-filter`/colored
`box-shadow`/`text-shadow` (none), the literal word `Inter` (none — only "Interactive"
substrings), and `gstatic` in `dist/` (none). Grepped `dist/assets/*.css` for
`--color-slate`/`--color-indigo`/`--color-violet` and `.blur-`/`.backdrop-blur-`/`.shadow-`/
`.rounded-`/`.animate-` utilities: none present, confirming the namespace resets actually
strip the generated CSS, not just the source. Loaded the app in a real Chrome instance via
`chrome-devtools`: no console errors, tab-focus lands on the skip link with a solid
2px accent outline (not a blur), and at a 360×740 emulated viewport `scrollWidth` equals
`innerWidth` (no horizontal overflow) with the masthead meta wrapped under the wordmark.
Measured the title-to-body font-size ratio in the live DOM: 48.4px / 15px = 3.23× at 360px,
clearing criterion 11. At a 2560px viewport, `.shell`'s computed width holds at 1248px,
matching `--frame-max: 78rem` — the measure stops growing rather than filling the canvas.

**Next session should know:**

- `--size-title` is now unused on this screen but is not dead: it is the token spec 04 or
  09 should reach for when a section needs a heading smaller than the page-level one Section
  renders. Do not repurpose `--size-display` for anything else without re-checking the 3×
  criterion on both the smallest and largest viewport.
- `Shell` imports `registry` and `registryWarnings` directly to build the colophon line, so
  it is not a "dumb" layout component — any spec composing a second `<Shell>` instance (there
  should only ever be one mounted) inherits that import.
- `.track-row` and `.track-list` live in `shell.css`, styled for the static index this spec
  ships. Spec 03 will very likely replace these classes' markup (rows become interactive) —
  reuse the classnames only if the visual result should stay identical; do not assume the
  static styling survives interactivity untouched (hover/focus states will need to merge).
- The dev server was run once against a real Chrome tab for verification and killed
  afterward (`taskkill` on the listening PID). No process was left running.

---

## 03 — Intake: track and level

**State:** `DONE` — 2026-08-18  **Depends on:** 01, 02

One screen: pick a track (game / app / portfolio / media), pick a level (beginner /
intermediate / advanced). Choice persists to localStorage. Re-entry skips the screen and
offers a way back to change it.

First real exercise of the shell with real data from the registry.

### Session notes — 2026-08-18

**Built:** `src/data/intake.ts` (`IntakeState`, localStorage read/write/clear, defensive
against missing/corrupt/invalid-value storage — never throws), `src/hooks/useIntake.ts`
(React-state wrapper so a write re-renders without reload), `src/components/Intake.tsx`
(track list + level list on one screen, no wizard step), `src/styles/intake.css` (level
list, submit control, "Change" control), and rewrote `src/App.tsx` to branch on stored
intake: none or editing → `Intake`; stored → a minimal confirmation Section plus a
"Change track / level" control in the masthead slot.

**Decided:**

- Merged T022 as flagged: `.track-row` moved from static `<li>` to `<li><button
  class="track-row">`, with a `button.track-row` reset block and a
  `.track-row--selected` modifier added to `shell.css` (not `intake.css`) because
  they extend a class spec 02 already owns. Everything genuinely new — `.level-list`/
  `.level-row`, `.intake__submit`/`.intake__continue`, `.intake-change` — went in the
  new `intake.css`.
- `IntakeState` lives in `src/data/intake.ts`, not `src/types.ts` — `types.ts`'s own
  header restricts it to shapes mirroring `data/nodes.json`/`data/tracks.json`, and
  intake state is not part of the registry.
- The confirmation view is deliberately one Section with one sentence of body text.
  Spec 04 replaces it wholesale; anything more built here would be thrown away.
- `Intake` takes optional `initialTrack`/`initialLevel` so first-run and "change" are
  the same component — no second picker implementation to keep in sync.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped `intake.css`/
`shell.css` additions/`App.tsx`/`Intake.tsx` for hex/`rgb(`/`gradient`/`backdrop-filter`/
colored shadow — none outside `theme.css`. Loaded in a real Chrome tab
(`chrome-devtools` MCP): first visit renders `Intake` with Continue disabled; selecting a
track and a level highlights exactly one row each and enables Continue; submitting swaps
to confirmation in the same render (no reload) and shows the right destination/level;
reloading with stored intake skips straight to confirmation; clicking "Change" reopens
`Intake` with both rows pre-selected (`pressed`); changing the level and resubmitting
overwrites the stored value and the confirmation text updates; setting the stored key to
`"not json"` and separately to `{"track":"nope","level":"beginner"}` and reloading both
fall back to a clean `Intake` screen with zero console errors — no crash. At a real
360×740 emulated viewport, `scrollWidth` equals `innerWidth` (no horizontal overflow).
A real `Tab` keypress (not a synthetic click) lands focus on a track row with computed
`outline: 2px solid rgb(228, 85, 46)` — `--accent`, the existing global `:focus-visible`
rule, no new focus style added.

**Next session should know:**

- The confirmation view (`App.tsx`'s non-editing branch) is a placeholder by design.
  Spec 04 should replace its body outright rather than extend it; keep the `!intake ||
  editing` branch and the masthead "Change" control, since nothing later should need a
  second navigation model for this.
- `useIntake`'s `resetIntake` is defined and exported but nothing currently calls it —
  "Change" reopens `Intake` pre-filled without clearing storage first, so a value is
  only overwritten on submit, never blanked mid-edit. Wire `resetIntake` to something
  (a hard "start over") only if a later spec actually needs a full-clear affordance.
- `roadmap:intake:v1` is the localStorage key. If spec 11 (progress portability) ever
  needs to export/import this alongside progress data, read/write it through
  `loadIntake`/`saveIntake`, not a second `localStorage` call — the corrupt-value
  guards live only in those two functions.
- A mouse click via CDP produced a *different* outline (UA default, `--text-primary`,
  3px) than a real `Tab` keypress (`--accent`, 2px, matching `:focus-visible`). This is
  Chromium's own focus-visible heuristic, not a bug — when verifying focus rings in
  browser, use `press_key: Tab`, not `click`.

---

## 04 — The path engine

**State:** `DONE` — 2026-08-18  **Depends on:** 01, 02

The load-bearing spec. One SVG `<path>` element per act. Node position is
`path.getPointAtLength(total * t)` — nodes never store x/y. A `usePathPoint(t)` hook returns
`{ x, y, angle }`, sampling `t + 0.001` and `Math.atan2`-ing the delta for facing.

Ships a bare path with plain dots on purpose. No cards, no character, no styling beyond the
theme. Ugly is correct here.

**Watch for:** this one element later serves four systems — placement, fog of war, character
position, completed glow. If any later spec computes a position a second way, the fog will
not line up with the nodes and the bug will be near-impossible to see. Reject any second
implementation.

### Session notes — 2026-08-18

**Built:** `src/path/pointAtT.ts` (pure position math: `getPointAtLength` plus a clamped
`atan2` sample for facing angle, with the `t = 1` edge sampling backward instead of
overflowing past the path's end), `src/path/PathContext.ts` (carries the mounted path ref
and its measured total length to every node under it), `src/hooks/usePathPoint.ts` (the
public hook, returns `null` until measured), `src/components/ActPath.tsx` (one act's
`<svg>`/`<path>`, measures total length once on mount, provides the context),
`src/components/PathNode.tsx` (one dot plus a mono label, gated on a non-null point),
`src/components/TrackMap.tsx` (one `Section` per act in `track.acts` order), and rewrote
`src/App.tsx`'s confirmation branch to render `TrackMap` instead of the spec 03 placeholder.
Added `src/styles/path.css`.

**Decided:**

- The dot, line, and label use `--text-secondary`/`--rule` — not `--accent`. Spec 02 spent
  the one accent hue on exactly three uses (selection, focus ring, track-row hover);
  reaching for it again here for something that isn't state (every node renders identically
  right now) would drift past `CONTEXT.md` section 8's "accent means state, not decoration."
  It stays free for spec 08's completed-progress glow, which is an actual state to mark.
- `usePathPoint` reads a `React.Context` rather than taking the path element as an argument,
  so every `PathNode` under one `ActPath` can call it without `TrackMap`/`ActPath` threading
  a ref through props for each of an act's several nodes. `pointAtT` itself stays a plain,
  context-free function — that's the one later specs (character, fog, glow) should keep
  reusing without needing React at all if they don't want to.
- Total path length is measured once in a `useLayoutEffect` keyed on `act.path`, not on a
  resize listener. `getTotalLength()` is in the path's own SVG user-unit space, which does
  not change when the container's CSS pixel width changes — only the `viewBox` scaling does.
  Confirmed this by resizing the emulated viewport from 1440 to 360 and reading unchanged
  `x`/`y` values on the same node.
- `.path-map` needed `overflow: visible`. Found by screenshot, not by reading the spec: the
  first and last node on the `game` track's `ground` act sit close enough to `t = 0`/`t = 1`
  that their labels' rendered width pushed past the `viewBox` boundary, and SVG's default
  `overflow: hidden` clipped "Prompting that works" down to "...mpting that works". Fixed
  with one property rather than touching `tracks.json` geometry, which is out of scope here.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0 (re-run after the
`overflow: visible` fix). Grepped every new file plus `path.css` for hex/`rgb(`/`rgba(`/
`hsl(`/gradient/`backdrop-filter`/`box-shadow`/`text-shadow`/`rounded-2xl` — zero matches.
Loaded in a real Chrome tab (`chrome-devtools` MCP): picked `game`/`beginner`, confirmed 7
`<svg class="path-map">` elements (one per act) each with exactly one `<path>`, 26 dots
total (the acts' own placed nodes — `game`'s 38-node count in the intake screen includes
frontier-branch nodes, which are spec 09's, not rendered here), every dot's `transform` a
real finite `translate(x y)` (no `NaN`, no stray `(0, 0)` at first paint), and computed
`fill`/`stroke` on dot/line/label all resolving to `--text-secondary`/`--rule` — never the
accent's `rgb(228, 85, 46)`. Changed track via Change → `portfolio`/`advanced`: dot/kicker
count changed to 8 `<svg>` (portfolio's 8 acts) and every kicker read "Portfolio" only — no
leftover `game`-track act titles in the DOM, confirming the unmount/remount is clean (shared
foundation nodes like "ChatGPT" reappearing under the new track is expected — they're the
same registry ids on both tracks, not stale DOM). At a 360×740 emulated viewport,
`document.documentElement.scrollWidth` (517) stayed under `window.innerWidth` (540) — no
horizontal overflow — and a screenshot confirmed dots/labels scale down with the `<svg>`
rather than overflowing the frame. Zero console errors throughout.

**Next session should know:**

- `pointAtT`, `PathContext`, and `usePathPoint` are the one position implementation
  `CONTEXT.md` section 9 asks for. Spec 07 (character) and spec 08 (fog of war / completed
  glow) should import these rather than recomputing anything — spec 08's second, dash-clipped
  path should reuse the same `act.path` string (it's already just data on `Act`), not clone
  the mounted DOM node.
- `ActPath` only renders dots once `totalLength > 0`; before that (one render, pre-layout-
  effect) the `<svg>` shows just the bare `<path>`. This is intentional per the interface
  contract (`usePathPoint` returns `null`, never a stale point) and was not treated as a bug.
- `TrackMap` renders every act in the track unconditionally — there is no act-to-act
  navigation yet (spec 10 owns it) and no branches (spec 09). On tracks with 7–8 acts this is
  a long scroll; that's expected for this spec and not something to "fix" here.
- `--size-title` (flagged unused in the spec 02 notes) is still unused — this spec's act
  headings reuse `Section`'s existing `--size-display` title, not a new size.
- The dev server used for verification was started on port 5183 (5199 was already running
  from something else and was left untouched) and killed by PID afterward.

---

## 05 — Node cards in the negative-space pockets

**State:** `DONE` — 2026-08-18  **Depends on:** 01, 04

Cards sit in the pockets the S-curve bends create, alternating sides from the `side` field
in `tracks.json`. Card shows title, blurb, level, and a completion affordance.

Also owns level filtering: nodes below the learner's chosen level collapse to a hairline
stub. Collapsed, never deleted — the learner can always expand.

### Session notes — 2026-08-18

**Built:** `src/path/viewBox.ts` (pure `parseViewBoxSize`), `src/components/NodeCard.tsx`
(card or, below the learner's level, a hairline stub — positions itself via the same
`usePathPoint(placed.t)` call `PathNode` makes, converted to a percentage of the act's
viewBox), and threaded a new `level: Level` prop from `App` through `TrackMap` into
`ActPath`, which now wraps its `<svg>` in a `.act-stage` container and renders one
`NodeCard` per placed node in a sibling overlay `<div>` sharing the same `PathContext`.
Added `src/styles/cards.css`. Also edited `src/components/PathNode.tsx` and `path.css` to
drop the bare dot's mono `<text>` label — see Decided.

**Decided:**

- **The card overlay is a plain HTML `<div>` sibling of the `<svg>`, not more SVG.** Cards
  need real text wrapping and buttons; `.act-stage` (`position: relative`, sized by the
  `<svg>`'s own `height: auto`) lets the overlay position children by percentage of the
  same box the path renders into, with no second size measurement.
- **Pocket offset is a small CSS transform nudge away from the anchor point, not stored
  geometry.** `PlacedNode` only carries `t` and `side` — there is no per-node pocket
  coordinate in the data — so `left`/`right` percentage plus a fixed `--space-unit`
  transform is the one interpretation that data shape supports. A left-side card is
  positioned with `right: (100 - leftPct)%` (grows leftward from the anchor) rather than
  `left` + `translateX(-100%)`, so its width never has to be known to avoid overflowing
  past the anchor.
- **Removed `PathNode`'s title label instead of leaving it.** Screenshotting the first
  build showed the spec-04 dot label sitting at the exact same point as the new card and
  overlapping its text (both render at the same `t`, same vertical center). Spec 04's own
  comment already flagged the label as provisional ("spec 05/08 add those"); since the
  card now carries the title, the fix was deletion, not repositioning — two labels for one
  node was never the intended end state. `path.css`'s now-dead `.path-node__label` rule
  went with it.
- **The completion toggle is `useState`, not wired to storage.** Spec 08 owns persistence
  and depends on this spec; wiring `localStorage` here would mean spec 08 either reworks
  this component or duplicates the read path. The button, class names (`.node-card__complete`,
  `aria-pressed`) and visual states (accent on pressed) are the contract spec 08 should
  land behind, per the interface note in `specs/spec-05-cards.md`.
- **Below 640px, cards leave the pocket layout entirely** and stack in normal document
  flow beneath their act's path (`position: static`, no transform). There isn't gutter
  room left over for a floating pocket once the frame narrows that far — confirmed by
  measuring `scrollWidth` against `innerWidth` at 360px before and after; the pocket
  layout alone did not fit.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped every new/edited
file for hex/`rgb(`/`rgba(`/`hsl(`/gradient/`backdrop-filter`/`box-shadow`/`text-shadow`/
`rounded-2xl` — zero matches. Loaded in a real Chrome tab (`chrome-devtools` MCP) against
the `game` track: 26 `NodeCard`s for 26 placed nodes, matching the dot count from spec 04's
own verification. At `beginner` level every card renders full (0 stubs, since nothing ranks
below beginner); switching stored level to `advanced` via `localStorage` + reload collapsed
25 of 26 to stubs, leaving only the one node whose own level is `advanced`. Clicking a
stub's title expanded it to a full card with a visible "Collapse" control; clicking that
control returned it to a stub — verified as two separate post-click queries, since reading
DOM state in the same `evaluate_script` call as the click that changes it can race the
re-render. A real focused `Tab`-reachable `Mark done` button responded to a real `Enter`
keypress (not a synthetic click) and toggled to "Done" with computed `color` equal to
`--accent` (`rgb(228, 85, 46)`). Switching track via "Change track / level" from `game` to
`portfolio` produced 34 cards for `portfolio`'s node count, including `ChatGPT` again — the
same shared foundation-node id reappearing on both tracks, not a stale unmount (same check
spec 04 made). Zero console errors throughout. At a 360×740 viewport,
`document.documentElement.scrollWidth` (517) stayed under `window.innerWidth` (540) on
both `game`/`beginner` (all full cards, stacked) and `portfolio`/`beginner`.

**Next session should know:**

- `NodeCard`'s completion toggle (`useState`) is the exact surface spec 08 should replace.
  Keep `.node-card__complete` / `aria-pressed` / the "Mark done" ↔ "Done" label pair; only
  the state source should change, from local `useState` to a persisted hook mirroring
  `useIntake`'s shape.
- `NodeCard`'s `expanded` (stub-collapse) state is also local `useState` and resets on
  remount — switching level or track re-collapses everything below the new level back to
  stub, even a node the learner had manually expanded a moment ago. That was not treated
  as a bug: expand-state persistence was never asked for by this spec, and re-deriving
  "collapsed by default below level" on every render is the simpler, correct behavior
  absent a stated requirement to remember an expand choice.
- `ActPath` now takes a `level: Level` prop it did not have before; any other caller
  constructing `<ActPath>` directly (there is currently only one, in `TrackMap`) needs it
  too.
- Branch nodes (frontier, spec 09) are still unrendered by `ActPath` — `act.nodes` only,
  same as spec 04 left it. `NodeCard` itself doesn't care whether a `PlacedNode` came from
  an act or a branch; spec 09 can likely reuse it directly rather than writing a second
  card component, as long as it also passes a `viewBoxWidth`/`viewBoxHeight` matching
  whatever `<svg>` the branch renders into.
- The dev server was run once on port 5183 (5199 was already running from something else
  and was left untouched, same as spec 04's session) for verification and killed by PID
  afterward.

---

## 06 — The node panel: pointers, never content

**State:** `DONE` — 2026-08-18  **Depends on:** 01, 05

Opening a node reveals its links grouped by `kind` (repo / docs / video / thread / article /
playground), its star count, last commit date, `status`, and `note`.

**Watch for:** the hard rule from `CONTEXT.md` section 3. This panel renders metadata about
a URL and links out. It never explains what the tool is or how to use it. If a task asks for
prose about a tool, that task is wrong — log it to `BLOCKED.md` rather than writing it.

### Session notes — 2026-08-18

**Did:** Built `NodePanel` — a native `<dialog>`, controlled by an `open` boolean prop rather
than an imperative handle, synced with `showModal()`/`close()` in an effect. Shows title,
level/status, star count and last commit (or `unverified` when either is `null`), `note`
when present, and every link grouped under its `kind` in the `KINDS` order `constants.ts`
already reserved for this spec, kinds with no links simply omitted. `NodeCard`'s title
became a `<button>` that opens its own `NodePanel`; the stub's expand control is untouched.
Added `src/styles/panel.css` for the dialog surface and `::backdrop`.

**Decided:** Went with a controlled `<dialog>` (`open` prop + effect) instead of a ref-based
imperative-open API, so `Escape` (which fires the dialog's native `close` event) and the
explicit close button both funnel through one `onClose` rather than two divergent paths.
Close-on-backdrop-click checks `event.target === dialogRef.current` — a click anywhere in
`.node-panel__content` targets a descendant, not the dialog element itself, so it never
false-triggers. Each `NodeCard` mounts its own `<dialog>` rather than lifting "which panel
is open" to `TrackMap`/`App`: this matches spec 05's existing precedent (completion/expand
state also stays card-local) and native `<dialog>` already guarantees only one can be the
page's active modal regardless of how many exist in the DOM. The backdrop dim uses
`color-mix(in srgb, var(--surface-base) 80%, transparent)` rather than a second hardcoded
colour — still one token, and not a `backdrop-blur` (which section 8 bans outright).

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped every new/edited
file for hardcoded colour/gradient/glow/emoji — none (the only regex hits were the word
"blurb"). In a real Chrome tab: clicking a full card's title opened that node's panel with
correct grouped links in `KINDS` order, star/commit placeholders for a hosted-product node
with both fields `null`, and its `note` rendered; `Escape` closed the panel and returned
focus to the title button that opened it; a script-dispatched click targeting the dialog
element itself closed the panel while a click on inner content did not; exactly one of 26
mounted `<dialog>` elements was ever `open` at a time; at a 360px-equivalent emulated
viewport (`innerWidth` 540, `scrollWidth` 517 — Chrome's emulate reports CSS px scaled by
DPR, but the two numbers stayed in the right relation either way) the panel filled the frame
width with no horizontal overflow and no layout breakage; zero console errors.

**Next session should know:** `NodePanel` takes a plain `Node`, not a `PlacedNode` — any
future spec rendering a node detail outside `NodeCard` (e.g. spec 09's frontier cards, if it
reuses `NodeCard` as spec 05's notes suggested) gets the panel for free by reusing
`NodeCard` itself rather than reimplementing panel wiring. `requires` (prerequisites) is
still not shown anywhere in the UI — out of scope here by the spec board description: a
navigation spec (10) is the more likely owner if it turns out to be needed. `--size-title`
is now used for the first time (`.node-panel__title`), closing `BACKLOG.md` T021.

---

## 07 — The character

**State:** `DONE` — 2026-08-18  **Depends on:** 04

`<Character t={0.42} facing="right" variant={{ body, hair, outfit }} />`. Code-drawn
geometric placeholder with a two-state bob. Position comes from the path engine, never from
its own maths.

**Watch for:** the props are frozen by `prompts/00-antigravity-assets.md`. Sprite sheets
arrive later and must slot in behind this exact interface. Getting the signature right now
turns a future refactor into a one-file swap. Do not block on assets.

### Session notes — 2026-08-18

**Built:** `src/components/Character.tsx` (the frozen `t` / `facing` / `variant` props, a
code-drawn placeholder of six flat rectangles across three layers in the sprite prompt's
compositing order — body → outfit → hair — positioned by `usePathPoint(t)` alone),
`src/hooks/useWalking.ts` (walk state derived from `t` changing, settling `WALK_SETTLE_MS`
= 400ms after the last change), `src/styles/character.css`, plus `facingFromAngle` in
`pointAtT.ts`, `pointToPercent` in `viewBox.ts`, `Facing`/`CharacterVariant` in `types.ts`,
a `characterT` prop and an `.act-stage__path` wrapper in `ActPath`, and a `character`
placement prop in `TrackMap`. `NodeCard` now calls `pointToPercent` instead of inlining
the same two divisions.

**Decided:**

- **The character is HTML, not SVG.** `prompts/00-antigravity-assets.md` describes the
  real thing as layered divs with `background-image`, `background-size: 400% 100%` and a
  shared `steps(4)` animation. Drawing the placeholder as SVG shapes would have made the
  sprite swap a rewrite of the positioning rather than of the drawing. It sits in an
  overlay that shares the `<svg>`'s box, so it is still positioned by the one path
  implementation — percentage of the same `viewBox`, exactly as `NodeCard` does.
- **`facing` is optional, defaulting to the direction of travel.** `CONTEXT.md` section 9
  says facing comes from the `atan2` of the path sample, but the frozen prop list includes
  `facing`. Both hold: `facing ?? facingFromAngle(point.angle)`, so the prompt's literal
  `facing="right"` still wins when passed. `facingFromAngle` puts ±90 on `'right'` rather
  than leaving a third case to fall through.
- **The bob runs only while `t` changes.** A walk cycle on a standing figure is ambient
  motion, which section 8 bans outright; gated on movement it is motion showing a state
  change, which section 8 allows. It is also what the sprite prompt asks for ("pause the
  animation when `t` is not changing"), so the gate survives the swap. Nothing in this
  spec moves `t` — spec 08 is the first caller that does, and is where the bob first
  appears in the running app.
- **`variant` is carried but not drawn.** Five skin tones would mean five colours that are
  not in `theme.css`. The values ride along in `data-variant` attributes so the sheets have
  something to key on; the placeholder geometry is variant-independent. Logged as T061.
- **The character got its own wrapper around the `<svg>` (`.act-stage__path`).** Found by
  measuring at 360px: below 640px `.act-stage__cards` drops to static flow, which makes
  `.act-stage` several times taller than the path, and an overlay inset to the stage put
  the walker's feet at 104.6% of the path's height — below its own act. Percentages now
  resolve against the `<svg>`'s box at every width.
- **Placement lives in `TrackMap`, not `Character`.** `TrackMap` decides which act hosts
  the walker (`character?: { actId, t }`, defaulting to the first act at `t = 0`) so spec
  08 can pass the progress frontier without touching the component.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped every new/edited
file for hex/`rgb(`/`hsl(`/gradient/`backdrop-filter`/`box-shadow`/`text-shadow`/
`rounded-2xl`/default-palette tokens — the only hit is the comment in `character.css`
saying `--accent` is deliberately not used. In a real Chrome tab: exactly one `.character`
in the DOM across a 7-act `game` track and an 8-act `media` track, hosted by act 1 both
times; its feet land on 9.17% / 19.73% of the act's `<svg>`, matching
`getPointAtLength(0)` (110, 150) over the 1200×760 `viewBox` to two decimals, at both
1440px and 360px; `document.elementFromPoint` through the character returns the `<svg>`
underneath, so the overlay intercepts nothing. Imported the modules straight off the dev
server to exercise the pure functions: `facingFromAngle` returned a facing for all 14 test
angles including ±90 and ±180, and `pointToPercent` returned 0 (not `Infinity`) for a
zero-sized viewBox. Mounted `Character` in a throwaway React root over a synthetic
right-then-left path: `walking` was `false` on mount, `true` on the commit after a `t`
change, still `true` 320ms after a change that arrived mid-settle (the timer restarts
rather than stacking), `false` ~580ms later, and `facing` flipped to `left` on the
leftward leg. Mounted `ActPath` with a zero-node act: bare path, no dots, no cards, the
character still standing at t = 0.5 (50% / 51.67% of a straight test path); with
`characterT` omitted, no character at all. `TrackMap` with an empty `acts` array rendered
nothing and did not throw. The bob itself was verified through the CSSOM plus forced
sampling — the test browser reports `prefers-reduced-motion: reduce`, which proved the
reduced-motion rule live (computed `animation-name: none` with `data-walking="true"`), and
with that rule overridden all three layers stepped between `translateY(0)` and
`translateY(-2px)` in lockstep under one `character-step` animation. Zero console errors
throughout.

**Next session should know:**

- **Spec 08's tween is the first thing that will ever move `t`.** Pass a changing `t` and
  the bob starts itself — there is no flag to set. Feed the tween through `TrackMap`'s
  `character` prop (`{ actId, t }`), not by editing `Character`; the component has no idea
  what progress is and should stay that way.
- `WALK_SETTLE_MS` (400ms) is how long the figure keeps walking after `t` stops changing.
  A tween that updates less often than that will stutter between walk and idle; one that
  updates per frame is fine.
- The character's containing block is `.act-stage__path`, a wrapper holding only the
  `<svg>`. Anything else that must sit on the path (spec 09's branch spurs, spec 08's
  frontier marker) belongs in that wrapper too, not in `.act-stage__cards`, which is
  `position: static` below 640px.
- `pointToPercent` in `src/path/viewBox.ts` is now the one SVG-point → CSS-percentage
  conversion; `NodeCard` and `Character` both call it. Do not inline a third copy.
- The placeholder is deliberately variant-blind, and its legs are one block rather than
  two (T061, T062). Both close themselves when the sheets land; neither is worth code now.
- Left-side node cards overflow the frame horizontally at mid widths (~730px client
  width) — pre-existing from spec 05, measured identical with the character overlay
  hidden, logged as T060. Whoever next touches `cards.css` should take it.
- The dev server for verification ran on port 5184 (5183 and 5199 were left untouched) and
  was killed afterwards.

---

## 08 — Progress and fog of war

**State:** `DONE` — 2026-08-18  **Depends on:** 04, 05, 07

Mark a node complete or incomplete; persist to localStorage. Fog of war is
`stroke-dasharray` and `stroke-dashoffset` on the same path from spec 04. Completed glow is
a second path layered above, dash-clipped to progress. Character `t` tweens toward the
progress frontier.

**Watch for:** "completed glow" here means a second stroke, not a `box-shadow` with colour.
Section 8 bans glow shadows and neon halos outright.

### Session notes — 2026-08-18

**Built:** `src/data/progress.ts` (localStorage half mirroring `intake.ts`, plus the pure
`computeTrackProgress`), `src/data/ProgressContext.ts`, `src/hooks/useProgress.ts`,
`src/hooks/useTweenedT.ts` (constant-speed `requestAnimationFrame` tween), a `progress` prop
and two dash-clipped `<path>` elements on `ActPath`, a `state` prop on `PathNode`, completion
read from the shared set in `NodeCard`, derivation + tween + per-act distribution in
`TrackMap`, and `n / m DONE` in `App`'s masthead. `path.css` gained the two strokes and the
three dot states.

**Decided:**

- **The accent marks *where you are*, not everything you have done.** The first build
  painted the completed stretch in full `--accent` and a finished act came out as an
  unbroken orange line across the screen — the opposite of section 8's "exactly one accent
  hue used sparingly". Final layering, bottom to top: `.path-map__line` (`--rule`, full
  length), `.path-map__reached` (`--accent`, clipped to `revealT`), `.path-map__walked`
  (`--accent-quiet`, clipped to `completeT`) painted **over** it. What survives is one short
  bright segment between finished and standing, with the character at its far end, and
  nothing bright at all once a track is complete. Completed dots use `--accent-quiet`, the
  one `current` dot uses `--accent`. `--accent-quiet` had been declared since spec 02 and
  used nowhere; this is its first use.
- **`current` is scoped to the track, not the act.** Scoping it per act (the first build)
  lit the first dot of every act the learner had not reached and stubbed a little trail out
  to each — seven simultaneous "you are here"s. The frontier act is now decided before its
  slice is computed, and it is the only act that marks a `current` node or draws a reveal
  ahead of its finished stretch. Acts beyond it get `revealT === completeT`.
- **The line draws the completed *prefix*, the dot draws the node.** Marking node 4 done
  before node 1 lights node 4's dot and leaves the stroke where it was. That is a display
  of what the learner actually did, not a rule about what they may do — nothing gates
  completion on prerequisites, and nothing here should.
- **Progress is one flat set of node ids, never per track.** The registry is one flat node
  list shared across tracks, so "ChatGPT" finished on `game` is finished on `portfolio`.
  Verified: switching tracks shows it done with no second write.
- **Ids in storage that the registry does not know are kept, not filtered.** Section 6 never
  deletes a node; an id from a track the learner has not opened, or from a later registry
  revision, must survive a visit that could not render it.
- **`ActPath` is memoised.** The tween sets a new `t` every frame and without `memo` all
  seven of a track's acts re-rendered on each of them. Measured mid-walk on `game`: 45fps
  without, 56fps with, against 62fps idle. Its props are referentially stable between
  tweens — `act` from the frozen registry, `progress` from one `useMemo`, and only the
  hosting act's `characterT` moves. `NodeCard` reads the completed set through context, so
  a toggle still reaches every card through the memo, as it must.
- **`useTweenedT` restarts a cross-act walk during render, not in an effect.** Doing it in
  the effect left one painted frame holding the old act's `t` resolved against the new
  act's geometry, which put the figure somewhere it had never stood. Caught by sampling
  every frame across an act boundary; the first frame on the new act is now exactly `t = 0`.
- **No second reduced-motion rule.** `base.css` already collapses every transition and
  animation duration under `prefers-reduced-motion: reduce`, so the block first written into
  `path.css` was deleted rather than kept as a duplicate. The JS tween checks the query
  itself and snaps, because a rAF loop is not a CSS duration.
- **The masthead count is a second `computeTrackProgress` call, deliberately.** `App`'s
  early return for the intake branch cannot hold a hook, and the walker's tween is one, so
  the derivation lives in `TrackMap`. Both calls are the same pure function over the same
  inputs and cannot disagree. Logged as T076 if it ever needs to change.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. A 4-track × ~20-completion-
subset suite over the real `tracks.json` plus synthetic edge cases (52 assertions) confirms
`computeTrackProgress` is total: every act present, `0 ≤ completeT ≤ revealT ≤ 1`, no `NaN`,
correct counts, exactly one `current` per track, none outside the frontier act, no trail stub
beyond it, and clamped output for deliberately non-monotonic / out-of-range / `NaN` `t`. The
suite was confirmed to actually fire by breaking an invariant and watching it fail. Grepped
the whole diff for hex/`rgb(`/`hsl(`/gradient/`backdrop-filter`/`box-shadow`/`text-shadow`/
default-palette tokens/emoji — the only regex hits are the substring "Inter" inside
"interface". `getTotalLength` appears exactly once in `src/`, `getPointAtLength` only in
`pointAtT.ts`, and there is no `cloneNode` or `querySelector` anywhere in `src/`.

In a real Chrome tab: a cleared-storage first run goes intake → map without creating the
progress key, and the key appears only on the first toggle. Marking a node writes
`{"completed":["chatgpt"]}`, flips the button to `Done`/`aria-pressed="true"` in `--accent`,
turns its dot ember, advances the strokes and the count, and survives a reload; un-marking
survives a reload too. `ChatGPT` completed on `game` reads as done on `portfolio` with the
stored value byte-identical, and the count reads `1 / 34` — branch nodes and the unknown id
`ghost-node` counted nowhere, and `ghost-node` came back out of a load/save round trip
intact. Twelve malformed storage values (`not json`, `null`, `42`, `"str"`, `[]`, `{}`,
`{"completed":"x"}`, `{"completed":[1,{},"ok",null,true]}`, duplicates, absent) all returned
a usable set and none threw; `Storage.prototype.getItem`/`setItem` stubbed to throw returned
an empty set and swallowed the write. Sampling every frame with `prefers-reduced-motion`
stubbed off: the walker holds still on mount, moves over ~68 distinct positions when a node
is marked, continues from its current position (never restarts) when a second node is marked
mid-walk, and enters a new act at exactly `t = 0` — `9.17%`, matching `getPointAtLength(0)`.
With the browser's real `reduce` preference the same actions snap and the stroke transitions
compute to `none`. Completing a whole track leaves every act at `reached = walked = 1`, zero
`current` dots, 34 complete dots, and the figure at the last act's path end (`11.6667% /
68.4211%`, exactly `getPointAtLength(L)`), facing left. Mounting `TrackMap` in a throwaway
React root: a zero-act track renders nothing and does not throw; an act with no placed nodes
renders a bare path with no dots, no cards and no walker, and the walker skips it to the next
real act; a single-node act renders one dot, one card and the figure. At `advanced` level 25
of 26 cards are stubs, the frontier sits on one, and expanding it exposes a working toggle.
At a 360px viewport `scrollWidth` equals `innerWidth`, the cards are in static flow, and the
character's feet land on the path end to the pixel. Switching tracks mid-tween unmounts
cleanly. Zero console errors or warnings throughout.

**Next session should know:**

- **`computeTrackProgress` is the only thing that may decide what progress looks like.** The
  strokes, the dots, the counts and the walker all read one call. Spec 09 adds branch nodes;
  they are excluded here on purpose (they sit on a different path and are unrendered), so
  that spec has to decide whether finishing a branch node counts toward the act's frontier
  and totals — and it should extend this function rather than compute anything beside it.
- **`ActPath` is wrapped in `memo`.** Anything a later spec adds as a prop must be
  referentially stable across a tween frame, or the memo silently stops helping. Derive it
  in `TrackMap`'s existing `useMemo`, not inline in the JSX.
- **`ProgressContext` must wrap anything that renders a `NodeCard`.** `useProgressContext`
  throws outside a provider by design. `App` provides it around both branches.
- Spec 07's `TrackMap.character` prop still works as an explicit override; `TrackMap` only
  falls back to the progress frontier when it is absent. `CharacterPlacement` moved to
  `data/progress.ts` and is re-exported from `TrackMap` so spec 07's import path still
  resolves.
- `WALK_SETTLE_MS` is 400ms and `TWEEN_MS_PER_T` is 2400ms, clamped to 180–1200ms. A
  one-node hop on the real geometry is ~0.17–0.21 of `t`, so ~410–510ms of walking — just
  under the settle, which is why the bob covers the whole walk and stops shortly after.
- The stroke transition is `calc(var(--dur-state) * 4)` = 480ms, chosen to land with the
  walker rather than to match it exactly. They are independent systems and do not need to
  be reconciled.
- The dev server for verification ran on port 5185 (5183, 5184 and 5199 were left untouched)
  and was killed by PID afterwards.


---

## 09 — The frontier branch

**State:** `DONE` — 2026-08-18  **Depends on:** 04, 05

Frontier nodes render as spurs off their `anchor` node, using the branch path geometry in
`tracks.json`. Visually distinct from the main path and explicitly marked unproven. 23 of
67 nodes live here.

Also renders demotion: a node with no commits in 12 months greys out and is marked dormant,
kept visible with its successor linked if one is known. Dead tools are useful information.
Nothing is ever deleted.

### Session notes — 2026-08-18

**Built:** `src/data/dormancy.ts` (the twelve-month rule as one pure `dormancyOf`),
`src/hooks/usePathLength.ts` (the measure-once logic lifted out of `ActPath` so a second
path can use it), `src/components/BranchPath.tsx` (one memoised spur: head, dashed path,
dots, cards), `BranchProgress` / `frontier` / `ActProgress.anchors` inside the existing
`computeTrackProgress`, an optional `successor` on `Node` with three validator rules plus an
`EMPTY_BRANCH` warning, registry-read zone and dormancy on `PathNode` with an `anchor` ring
prop, dormant styling and a successor line on `NodeCard`, a `Freshness` fact and a successor
link on `NodePanel`, `· n / m FRONTIER` in `App`'s masthead, and `src/styles/branch.css`.

**Decided:**

- **A branch renders under its act, not on top of it.** A branch's viewBox is `0 0 640 320`
  and an act's is `0 0 1200 760`; they share no coordinate space. Drawing the spur out of
  the anchor's real point would mean inventing a transform between two unrelated viewBoxes
  and then fighting the act's card overlay for the same pixels. The attachment is stated
  instead — the head names the anchor ("Spur from Claude Code") and the anchor's dot on the
  main path wears a hairline ring.
- **A branch stacks its cards; it does not pocket them.** This one was found by measuring,
  not by reading. The first build floated branch cards in the spur's negative space exactly
  as `ActPath` does; on `portfolio` two pairs overlapped, and the largest spur in the
  registry (`app` / "Deeper tooling") places **seven** nodes on that 320-unit box, which no
  stage width fixes. So the spur is the diagram — order, dots, completion, unproven dashes —
  and the cards read below it in placed order, which is the layout `cards.css` already falls
  back to under 640px. One behaviour at every width instead of two.
- **Unproven is dashes, not colour.** The spur uses the road's `--rule` hairline with
  `stroke-dasharray`. Dashes read as provisional for free; the accent stays spent on where
  the learner is standing (section 8). Frontier dots are hollow — the same circle drawn as
  an outline — so they read provisional beside a filled one without a second hue.
- **Dormancy is derived from `last_commit`, not stored.** Section 6 says demotion is
  *automatic*, so the rule is applied at render against today's date rather than typed into
  `nodes.json` by a session that happened to notice. A `status` of `dormant` or `superseded`
  is honoured too, because a project can be abandoned while its last commit is recent.
  Nothing in the registry is dormant today; the rendering was verified by patching two nodes
  in a scratch copy of `nodes.json` and restoring it.
- **On a dot: `current` beats dormancy beats completion.** A finished dead tool is still
  dead, and the card and the counts already say it was finished — but exactly one dot on a
  track says "here", and the map must not lose it because the tool the learner is standing
  on stopped moving.
- **The frontier is counted beside the road, never into it.** `computeTrackProgress` returns
  branch tallies separately: each branch head shows `n / m explored` and the masthead shows
  `· n / m FRONTIER`. Marking a branch node moves neither the fog, the walker, nor
  `n / m DONE`. Spec 08 left this question open on purpose; this is the answer.
- **`successor` is a node id, never a URL.** The card prints "Superseded by <title>"; the
  panel links it through the successor's own first registry link, which is a URL already
  verified in the registry.
- **An empty branch is not drawn, and the validator says so.** `EMPTY_BRANCH` is a warning
  rather than an error: the data is usable, just pointless, and something the map declines
  to draw has to be said out loud.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0; the registry still
validates 0 errors / 0 warnings. An 824-assertion suite ran `computeTrackProgress` over all
four real tracks against five completion subsets each — branch map size, per-branch
done/total, no `current` on any branch, the frontier tally, the road's totals unaffected by
branch completions, and anchors landing only on the act that actually places the anchor —
plus synthetic tracks with no branches, an empty branch, a branch naming an act that does
not exist, and an act with no nodes. The suite was checked against deliberately wrong
expectations to confirm it can fail. Nine `dormancyOf` cases cover null, fresh, exactly 365
days, 366, declared-dormant-with-a-fresh-date, superseded, a future date, an unparseable
date and an empty string. Five validator mutations confirm `UNKNOWN_SUCCESSOR`,
`SELF_SUCCESSOR`, the `BAD_NODE_FIELD` type check, a clean pass on a valid successor, and
`EMPTY_BRANCH`.

In a real Chrome tab: all 21 branches render — 5 on `game`, 4 on `app`, 7 on `portfolio`,
5 on `media` — each inside the `Section` of the act it names, in `track.branches` order,
with anchor rings on exactly the distinct anchors (4 / 4 / 6 / 5, `claude-code` anchoring
two branches on three tracks). Branch dots match `getPointAtLength(total * t)` to two
decimal places. Marking a branch node flips its button, turns its dot, advances the branch
tally and the masthead's `FRONTIER` count, leaves `DONE` and the fog stroke untouched, and
survives a reload. Panels open from branch cards; stubs expand, complete and collapse. A
geometric overlap scan (card/card, card/head, card outside its block) reports zero across
all four tracks at three levels at 1440px and at an emulated 360px, where `scrollWidth`
equals `clientWidth`. Dormancy was exercised by patching `what-is-a-skill` to a 2024 commit
date and `cline` to `status: dormant` with `successor: opencode`: both cards greyed and said
`dormant`, `cline` printed "Superseded by OpenCode" and linked it in the panel, and the
panel's Freshness read "dormant — 956 days since last commit" and 'dormant — registry status
"dormant"' respectively, against "active — 1 day since last commit" for a live node.
`data/nodes.json` was restored byte-for-byte afterwards. Throwaway React roots covered a
track with no branches, a one-node branch, an empty branch (not drawn), a branch on a
missing act, and a track with no acts — none threw. Mid-tween on `portfolio`: 55fps against
62 idle, with zero mutations observed in a branch subtree, so the `memo` holds. Zero console
errors or warnings throughout.

**Found in review, then fixed:** eight things. The anchor ring in `--rule` was invisible at
20px, so it moved to `--text-muted`. Branch heads and cards collided at 8px, then left-side
cards reached back past the branch's own hairline, then — after two rounds of widening and
narrowing — the pocket layout was abandoned for the stacked one above; that is the real fix
and the earlier two were symptoms of it. Branch cards kept a pocket width at 360px because
the new rule outranked `cards.css` by specificity. The panel said "1 days". An empty branch
drew a spur to nowhere with "0 / 0 explored". A dormant `current` dot lost its accent. And
one line ran past 100 columns.

**Next session should know:**

- **`computeTrackProgress` is still the only place progress may be decided**, and it now
  covers branches. Spec 10 wants the frontier act and the per-act slices that are already
  there; do not recompute either.
- **The branch layout is deliberate and load-bearing.** `.act-stage--branch` overrides the
  pocket positioning with static flow at every width. If a later spec restores floating
  cards on a spur, it has to solve seven nodes on a `640x320` viewBox first — the numbers
  are in `branch.css`.
- **`BranchPath` is memoised like `ActPath`.** Any prop a later spec adds must be
  referentially stable across a tween frame; derive it in `TrackMap`'s existing `useMemo`.
- **`usePathLength(d)` is the one path measurement.** `getTotalLength` appears exactly once
  in `src/`. A third path (spec 10's overview map) should use the hook, not re-measure.
- **`dormancyOf` reads the clock.** Rendering therefore depends on the date: a node with a
  `last_commit` older than 365 days greys out with no data edit at all. That is section 6's
  "automatic", and it means a screenshot taken a year from now will differ from today's.
  `now` is injectable for tests.
- **Nothing in the registry is dormant or has a `successor` today.** The field and the
  rendering exist and were verified against patched data; the data that uses them arrives
  when a tool actually goes dormant.
- **`PathNode` now reads the registry** for zone and dormancy, so it throws on an id the
  registry does not know — the same contract `NodeCard` already had, and one the validator
  makes unreachable.
- The dev server for verification ran on port 5186 and was killed by PID afterwards.

---

## 10 — Act navigation and the overview map

**State:** `DONE` — 2026-08-18  **Depends on:** 04, 08, 09

Move between acts. Each act is its own serpentine screen. A zoomed-out overview chains the
acts into one map so the whole road is legible at once.

Act counts per track: game 7, app 6, portfolio 8, media 8.

### Session notes — 2026-08-18

**Built:** `src/data/navigation.ts` (the whole view-state logic as pure functions —
`ActView`, `resolveAct`, `neighbourActs`, `actRefOf`, `initialView`, `padIndex`),
`src/path/dash.ts` (`dashToFraction`, lifted out of `ActPath` the moment a second drawing
needed it), `src/components/ActNav.tsx` (overview link, `Act 03 / 07`, and the "you are in"
jump), `src/components/ActPager.tsx` (previous / next act by name),
`src/components/Overview.tsx` (the act rows plus the private `ActMini` miniature),
`ActProgress.frontier` inside the existing `computeTrackProgress`, a rewritten `TrackMap`
that holds the view and renders one act or the overview, and `src/styles/navigation.css`.

**Decided:**

- **The map opens where the learner is standing, not at act 01.** `initialView` reads the
  same placement the walker is drawn from (`character ?? progress.placement`), so the figure
  is on screen at mount and the first thing a returning learner does is not scroll. Opening
  on the overview was the alternative and was rejected: the overview is a table of contents,
  and opening a book at the contents every time is a worse default than opening it at the
  bookmark.
- **Marking a node done never moves the view.** Finishing the last node of the act on screen
  advances the frontier to the next act; the screen stays put and `ActNav` starts offering
  "You are in 04 Tools". A screen that navigates itself out from under a pointer is worse
  than a stale one, and the walker leaving is exactly the thing that control is there to
  explain.
- **Previous/next live at the foot of the act; the overview is the random access.** One
  control per job. The position indicator answers "where am I" at the top, the road is
  walked forward so the way onward belongs at the end, and putting both in both bars would
  have made the two rules read as the same bar twice.
- **The overview is a stack of rows, not a grid of tiles.** Section 8 bans bento grids
  outright and the acts are a sequence; a hairline-ruled column in index order is the
  editorial form and the honest one.
- **No connector drawn between the miniatures.** The curves start and end at different
  corners (`long` ends at x=130, `medium` at x=1070), so a line joining two rows would be
  decoration pretending to be geometry — the thing section 8 exists to stop. What chains the
  acts is the stack order and the progress painted continuously across it.
- **The miniatures carry no dots.** At ~11rem a 1200-unit act cannot hold six legible dots
  and no labels at all. The row's `n / m done · n / m frontier` says what the dots would
  have, and the strokes say how far along it is.
- **Hover and "here" must not look alike.** A row's hover marker is `--text-muted`; the
  accent left marker is reserved for the act the learner is standing in. If the pointer
  could produce the accent, the accent would stop meaning "here".
- **One source for "where the learner is".** The overview's marked row and the act screen's
  jump control both read the value the figure is drawn from, passed down as `standingActId`,
  rather than each deriving it. Two derivations of one fact is how a map ends up marking two
  different acts.
- **`ActProgress` gained the per-act frontier tally rather than the overview counting
  spurs.** Spec 08's note is explicit that `computeTrackProgress` is the only thing that may
  decide what progress looks like, and spec 09 added the branch slices to it for the same
  reason. Keyed on `branch.act`, because that is the act a spur is drawn under.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0; the registry still
validates 0 errors / 0 warnings. A 502-assertion suite over the four real tracks covers
every act's index, ref, neighbours and resolution, the unknown-id cases, `initialView` at
zero / two-acts-done / fully-complete / bad-placement, and the per-act frontier tally
against three completion subsets each — including that the tallies sum to the track's, that
branch completions leave every act's `revealT` and the road's totals untouched, and that a
spur naming an act that does not exist counts in the track total but on no act's row. The
suite was checked against deliberately wrong expectations to confirm it can fail. Synthetic
cases cover a track with no acts, a one-act track, an act with no nodes that still hosts a
spur, and a barren act.

In a real Chrome tab: a cleared-storage first run goes intake → act 01 with one `Section`,
one act `<svg>`, its branch, a walker and one `current` dot — and no other act in the DOM.
The pager walks all seven acts of `game` forward and back, the position reads `Act 0n / 07`
at each step, the first act offers only next and the last only previous, and every step
lands at `scrollY` 0 with focus on `.map-screen` (the first mount focuses nothing). Progress
that finishes acts 01–02 opens the map on act 03. Completing the act on screen leaves the
heading where it was, drops the walker and raises "You are in 04 Tools" in the accent.
Overview: all seven rows on `game` and all eight on `portfolio`, tallies summing exactly to
the masthead's `n / m DONE` and `· n / m FRONTIER`, exactly one row marked, and each
miniature's dash clip equal to that act's `revealT` / `completeT` to three decimals —
checked against the full-size act's own strokes (0.414 / 0.242 on both). Five throwaway
React roots (no acts, one act, an act with no nodes, an empty branch, a very long act title)
render without throwing and without horizontal overflow. At an emulated 360x740 the
miniature wraps below its row's text and `scrollWidth` equals `innerWidth` on both screens.
Zero console errors or warnings throughout.

**Found in review, then fixed:** six. The one that mattered: the miniatures were first drawn
with `vector-effect: non-scaling-stroke` to keep the hairline visible, which silently moved
the *whole* stroke — dash pattern included — into device space, so a `stroke-dasharray` of
3298 user units became 3298 device pixels against a path only ~480 long, and every miniature
drew an arbitrary slice of itself in the accent. It looked plausible on screen and was found
by reading the computed dash values against the measured path length. The stroke is widened
in user units instead. Also: `initialView` ignored spec 07's `character` override, so a
hand-placed figure could open off screen; the "you are in" control and the overview's marked
row derived the standing act separately; `pad` was copy-pasted into four files; a dead
`margin-left: 0`; and a doc comment left describing the fix that had been removed.

**Next session should know:**

- **`TrackMap` renders one act or the overview — never the whole track.** Anything that
  wants to reach a specific act goes through `selectAct` / `ActView`; there is no scroll
  target for an act any more, and no `id` anchors were added.
- **The view lives in React state and nowhere else.** No URL, no hash, no storage key
  (T105, T106). The browser's back button leaves the app. Spec 12 owns the Pages base path
  and 404 handling and is the place to decide whether a hash route is worth it; spec 11
  owns storage and should read T106 before adding a key for this.
- **`computeTrackProgress` still decides everything about progress**, now including each
  act's `frontier` tally. The overview counts nothing itself and neither should anything
  else.
- **`dashToFraction` is in `src/path/dash.ts` and `usePathLength` is still the only
  measurement.** Three drawings of one act now share both. A fourth must reuse them, and
  must not put `vector-effect: non-scaling-stroke` on a dash-clipped path — see above.
- **`padIndex` in `data/navigation.ts` is the two-digit act label.** `Intake` still has its
  own inline `padStart` for the track index, which is a different sequence; it was left
  alone deliberately.
- **Focus and scroll move on navigation, gated by a ref flag** so the first mount does
  neither. `.map-screen:focus { outline: none }` is deliberate: the container is not in the
  tab order and the whole screen changing is the feedback.
- The dev server for verification ran on port 5187 (5183–5186 and 5199 were left untouched)
  and was killed by PID afterwards.

---

## 11 — Progress portability

**State:** `DONE` — 2026-08-18  **Depends on:** 08

Export progress to a JSON file, import it back, reset it. This is how a learner moves
between devices without an account. It is the entire sync story and it must stay that way.

**Watch for:** no backend, no auth, no database. If a task here starts describing a server
route, it has violated the constitution.

### Session notes — 2026-08-18

**Built:** `src/data/portability.ts` (the file's shape and every decision about one:
`ProgressFile`, `buildProgressFile`, `serializeProgressFile`, the total `parseProgressFile`,
`exportFilename`, `MAX_PROGRESS_FILE_BYTES` and one sentence per refusal in
`IMPORT_PROBLEM_MESSAGE`), `parseIntake` extracted out of `loadIntake` so storage and an
imported file validate a track and level from one definition, `replaceProgress` on
`useProgress`, `src/components/ProgressPanel.tsx` (a controlled native `<dialog>` on the
`NodePanel` pattern, holding export, import and a two-step reset with one status line), the
`Progress file` control in the masthead of both screens plus the import wiring in `App`, and
`src/styles/portability.css`.

**Decided:**

- **The file carries the intake, not just the ids.** Moving device means landing on the same
  map at the same level. A file whose intake this build cannot read still imports its
  completions and leaves the device's own track alone — a bad `track` string is not a reason
  to throw away someone's progress.
- **Import replaces, it never merges.** The file has no per-node timestamps, so there is no
  honest rule for which of two sets is newer. The panel says so in the row itself, before the
  file picker opens, rather than after the fact.
- **Five refusals, each a sentence.** `unreadable`, `too-large`, `not-a-progress-file`,
  `unsupported-version`, `empty`. Every one ends "Nothing was changed", because that is the
  fact the learner actually needs. The size cap is checked before the read: `accept=".json"`
  does not stop a misclicked video, and `JSON.parse` on a gigabyte freezes the tab.
- **A well-formed file with no ids and no intake is refused as `empty`** rather than applied.
  Exporting an empty set is still allowed — it is a legitimate state to carry — but importing
  nothing over something would be a silent no-op the learner could read as a success.
- **Reset arms and confirms in place**, never `confirm()`. Closing the panel disarms it, so
  an arm cannot outlive the panel it was made in.
- **`parseIntake` was extracted rather than duplicated.** Two validators for a track id would
  eventually disagree, and the import door is exactly where a stale one would show.
- **The panel is not a screen.** It is a `<dialog>` hanging off both branches of `App`, which
  is the only component holding both the completed set and the intake.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0; the registry still
validates 0 errors / 0 warnings. An 81-assertion suite over the pure half covers 22 hostile
inputs for totality, every refusal code, dedupe, dropped non-strings, kept unknown ids,
deterministic bytes, the filename in two months, and `parseIntake`; it was re-run against a
deliberately wrong expectation to prove it can fail. In a real Chrome tab: the export's blob
captured and read back (correct MIME, dated filename, anchor in the document at click time
and removed after, object URL revoked); four bad files each refused with their own sentence
and nothing applied; a 5MB file refused unread; a good file replacing `{chatgpt, claude-chat,
gemini}` with its own four ids including one the registry does not know; the fog's
`stroke-dashoffset` moving 3298 → 1649 and the masthead with it, no reload; the two-step
reset leaving `0 / 35` and an empty key; reopening the panel disarmed with no stale sentence;
`Escape`, the backdrop and `Close` all closing it with focus returning to the opener; a fresh
device (storage cleared) importing straight from the picker onto the Portfolio map; and a
full export → reset → import round trip restoring the exact set and intake. At 360x740 the
rows stack, nothing overflows and the status line scrolls itself into view. Zero console
errors.

**Found in review, then fixed:** four.

1. The `<dialog>` kept the UA stylesheet's own `overflow: auto`, so it scrolled beside the
   content's scroller — two bars, ~30px eaten out of every row, and the action buttons
   wrapping under their notes for no visible reason. One `overflow: hidden` on the dialog.
2. The status line sat below the fold on a phone, so an import's outcome was invisible on the
   screen where it matters most. It now scrolls itself into view with `block: 'nearest'`,
   which is a no-op on a desktop.
3. No size guard: a misclicked video would have been read whole and handed to `JSON.parse`.
   `MAX_PROGRESS_FILE_BYTES` (4MB) is checked against `file.size` before the read.
4. The file input was `display: none`, which more than one engine has ignored on a
   programmatic `.click()`. It is now rendered at 1px and transparent, out of flow,
   `tabIndex={-1}`, driven by a real button.

**Next session should know:**

- **`data/portability.ts` is React-free and DOM-free and must stay that way.** The `Blob`,
  the object URL, the anchor and the file input all live in `ProgressPanel`. That is what
  makes the parser testable under bare `node --experimental-strip-types`.
- **`parseIntake` is now the one definition of a valid intake.** Anything that reads a track
  or level from outside the app goes through it.
- **`replaceProgress` writes through the same effect `useProgress` already persists with.**
  Do not add a second writer to `roadmap:progress:v1`.
- **A reset leaves `{"completed":[]}` in storage, not an absent key.** `clearCompleted`
  removes it and the persist effect immediately rewrites the empty set. Harmless, deliberate,
  and the reason acceptance criterion 10 is worded about a non-empty set.
- **`ProgressPanel` keeps its state across the picker → map switch** because it sits at the
  same position in both branches' children. That is why an import made on the picker still
  shows its status sentence on the map. Moving it inside either branch would break that.
- **The version gate refuses forward, not backward.** A file with `version: 2` is refused by
  this build; if the shape ever changes, bump `PROGRESS_FILE_VERSION` and decide explicitly
  what to do with a version-1 file rather than letting it fall through.
- The dev server for verification ran on port 5191. Killing it with `taskkill /IM node.exe`
  also killed the MCP browser server — kill by PID next time.

---

## 12 — Ship: build gates and GitHub Pages

**State:** `DONE` — 2026-08-19  **Depends on:** 01–11

`npm run build` and `npx tsc --noEmit` wired as gates. A script that fails the build on any
hardcoded colour outside `theme.css`. GitHub Pages base path and 404 handling for a static
deploy.

### Session notes — 2026-08-19

**Built:** `scripts/check-theme.ts` (the source gate: `colour-literal`, `type-literal`,
`banned-construct`, `unknown-token`, over every `.css`/`.ts`/`.tsx` under `src/` except
`theme.css`, plus `index.html` and `public/`), `scripts/check-output.ts` (the built-output
gate: the deploy files present, no sourcemap, no absolute asset path, no section 8 utility
class, no gradient), both wired into `npm run build` and both runnable alone; two more
functions in `scripts/node-shims.d.ts`; `sourcemap: false` in `vite.config.ts` with the
`base` decision written down rather than deferred; `public/404.html` and `public/.nojekyll`;
and `.github/workflows/pages.yml`.

**Decided:**

- **Sourcemaps are not shipped (T018).** 1.13 MB of map against 287 kB of JS, downloaded for
  the benefit of a developer who could clone the repo and run `npm run dev`. `check:output`
  fails on any `.map` in `dist/` or any `sourceMappingURL` in an asset, so the decision has a
  guard rather than a comment.
- **No router and no hash route (T105).** A deep link is a navigation feature and spec 10 owns
  navigation. `404.html` sends any stray path to the deploy root, which is the right answer
  for a one-page site and stays right if a hash route is ever added — a hash never reaches
  the server, so nothing about the deploy would change.
- **No favicon (T017).** `href="data:,"` already suppresses the request, so there is no bug,
  and a hand-drawn icon file would have been the first colour outside `theme.css` on the very
  day the gate forbidding one landed. If an icon is ever wanted it has to be *derived* from
  `theme.css`, not drawn beside it. That constraint is now in T017.
- **`404.html` has no stylesheet, no font and no colour.** It is a redirect, not a page. That
  is what keeps it from violating the gate it ships beside and from going stale the day the
  theme is swapped. It redirects only over `http(s)` and only when the current path is not
  already the computed root, so neither an undeployed site nor a file opened from disk can
  loop.
- **`unknown-token` accepts a property declared anywhere in the scanned source**, not only in
  `theme.css`. A local geometry property is a legitimate thing to write, and a colour smuggled
  into one is still caught by `colour-literal`. The rule's remaining job is the typo:
  `var(--text-secondry)` renders as nothing today and nothing says a word.
- **`scripts/` is not scanned and must not be added.** `check-theme.ts` holds all 148 CSS
  named colours as data and would fail on itself. Nothing under `scripts/` renders anything.
- **CSS comments are stripped before matching; TS and TSX are read raw.** Several stylesheets
  explain a colour decision in prose, and a gate that fails on its own documentation only
  teaches people to delete the documentation. No `.ts`/`.tsx` file has a colour literal in
  either code or comment today, so scanning them raw costs nothing and closes the "parked for
  reference" hiding place.
- **CI runs `npm run build` verbatim, unsplit.** If the workflow ran the pieces separately it
  would eventually run a different set of pieces than a session does, which is the exact
  failure this workflow exists to prevent.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0; the registry still validates
0 errors / 0 warnings; the theme gate reports 51 files scanned, 31 tokens declared, 0
violations and 1 warning — `--weight-medium`, declared and read nowhere, which is a warning by
design and never a failure. A probe stylesheet carrying ten deliberate violations produced
exactly ten findings, each on the right line, and its `.probe-ok` twin — `color-mix()`,
`transparent`, `currentColor`, `font: inherit`, `font-size: var(--size-micro)`,
`box-shadow: none` — produced none; a comment naming orange, off-white and a gradient was
ignored. A second probe proved a locally declared `--probe-x` is not an `unknown-token`, that
`--probe-bg: #123456` still fails as a `colour-literal`, and that a declaration on the line
after a semicolon is reported on its own line. `npm run build` exits 1 with a probe present.
The output gate exits 1 with `dist/` absent, with a planted `.map`, with `href` rewritten to
`/assets/…`, and with planted `.shadow-lg`, `.backdrop-blur-md`, `.rounded-2xl`,
`.animate-pulse`, `.bg-slate-900` and `linear-gradient()`; it exits 0 against the real build,
where `.backdrop-filter` and `.filter` are both present in the CSS and correctly not reported.
`vite preview` returned 200 for `index.html`, for the hashed JS asset and for `404.html`, with
the asset referenced as `./assets/…`. `dist/` contains `.nojekyll`, `404.html` and no `.map`.
Nothing under `src/` was modified by this spec.

**Found in review, then fixed:** five.

1. **Every reported line number could be one too low.** The declaration matcher anchors on the
   `;` that ends the *previous* declaration, and that semicolon is usually on the previous
   line. It only looked right in testing because the property name happened to appear inside
   the matched text. Now the offset is found case-insensitively inside the match and the
   report points at the property.
2. **`unknown-token` only knew `theme.css`.** The first component to declare a local
   `--card-x` would have been a build failure for doing something legal. Tokens are now
   collected from every scanned file as well, including quoted keys in a TSX inline style.
3. **`1 warnings` and `1 problems`** in both summary lines. One `plural()` each.
4. **The 404 redirected under `file://` too**, which would have thrown a reader opening the
   built page from disk at their filesystem root. Guarded on `http(s)`.
5. **Nothing recorded why `scripts/` is unscanned**, which is the kind of omission a later
   session fixes by "improving" the gate until it fails on itself. Now in the file header and
   in T132.

**Next session should know:**

- **`npm run build` is five steps now** — `validate:data`, `check:theme`, `tsc --noEmit`,
  `vite build`, `check:output` — and the last one needs `dist/` to exist. Run the whole
  script, not its parts; `check:output` alone against a stale `dist/` proves nothing.
- **Both gates are plain Node under `--experimental-strip-types`.** They may not import
  anything from `src/` that touches the DOM, and they may not use a Node API that is not
  declared in `scripts/node-shims.d.ts`. `BLOCKED.md` explains why `@types/node` is still not
  a dependency.
- **Do not add `scripts/` to the theme gate's scan.** It will fail on itself; see T132.
- **The theme gate does not read `data/`, `prompts/`, `specs/` or any `.md`.** A colour in a
  spec file is documentation, not a style.
- **The workflow has never run.** This repo has no git remote, so `npm ci` and the Pages
  actions are untested here, and GitHub Pages has to be switched to the "GitHub Actions"
  source in repository settings by hand before a first push publishes anything (T131).
- **`base: './'` is load-bearing for the deploy** and `check:output` is what keeps it honest.
  Anything that introduces an absolute asset path fails the build rather than the site.
- **There is no README (T130).** It is the obvious next non-feature task and the one a public
  deploy makes conspicuous.

---

## Deferred to v2 — do not build

Leaderboards, peer verification, guilds, social streaks, proof-of-work submission. All need
a backend. v1 is the map only. If one of these appears in a task, the task is wrong.

---

## 13 — Visual overhaul: the paper roadmap

**State:** `DONE` — 2026-08-19  **Depends on:** 01–12

The identity changed. `CONTEXT.md` section 8 was amended by the project owner — the only edit
that file has ever taken — from *editorial dark terminal* to *paper roadmap*, and spec 13
carried the new identity through every screen the first twelve specs built.

It also cleaned up after a non-Ralph session (Codex) that had attempted the same change
without amending section 8. Four of its five defects were structural rather than cosmetic:
a `content: 'LANE'` brand injected through CSS, a paper palette under an unchanged serif type
stack, card colour assigned by `nth-child`, and cards centred on their own path point so that
every one of them sat on the road.

**Next session should know:**

- **The pocket layout is solved, not formulated.** `src/path/pockets.ts`
  scores four candidate pockets × nine slide offsets per card against the sampled road and
  against the cards already placed, and takes the lowest score. Do not replace it with an
  offset rule; "no card covers the road" is a property of a whole act, because a serpentine
  shares each band between two runs and loops back through the space it just left.
- **The curves are portrait and sized off the card.** Runs sit 420 units apart with a
  240-unit margin outside the first and last. That is not decoration: at the old landscape
  `1200x760` the bands were 230 units and a card is 205–256, so *no* placement rule could
  have worked. If a card's height ratio in `ActPath.cardSize` changes, the band arithmetic in
  `data/tracks.json` has to be re-checked.
- **The pocket breakpoint is 78rem and it is measured.** A card never shrinks below 224px, so
  the narrower the stage the *larger* the card is in viewBox units. Two cards stop fitting in
  a band below about an 1157px stage. Below 78rem the act is a road strip plus a numbered
  stop list; the stop numbers come off the road there because they would render under 4px.
- **Colour is keyed to the first link's `kind`, not to level.** Level was tried first and
  measured wrong: the acts ramp, so an act's nodes almost all share a level and every screen
  came out one flat colour. Every card also prints its kind in words, so colour is never the
  only channel.
- **The lift is `drop-shadow(x y 0 ink)`.** `box-shadow` is rejected by `check:theme`, and an
  offset pseudo-element does not work either — `rotate` makes a card a stacking context, and
  a negative-z child of one paints over its parent's own background. Every card came out
  solid black the first time.
- **Lengths inside an `<svg>` are viewBox user units.** `--road-gauge` and friends are
  unitless numbers for that reason. A `rem` there is not a page length.

## 14 — Completion payoff: the game-psychology pass

**State:** `DONE` — 2026-08-20  **Depends on:** 01–13

Opened directly by the project owner in conversation, not by a Ralph-loop session reading
the board — the board had nothing `READY FOR DEVELOPMENT` and correctly said so. Full
rationale in `specs/spec-14-completion-payoff.md`.

Four reward moments, all one-shot and all gated on an actual state change rather than on
render: a stamp on the `Mark done` button, an "Act cleared" badge, a track-shipped banner
plus an accent-filled masthead chip, and a reveal animation on expanding a below-level stub.
No new colour, no new surface, no new npm dependency — every value is a token, and the two
new ones (`--dur-reward`, `--ease-reward`) exist because the existing `--dur-state` /
`--ease-state` are deliberately too flat and too fast for a moment that is supposed to feel
like winning something rather than a routine hover.

**Next session should know:**

- **`useJustCompleted` is the pattern for any future one-shot state-change animation.**
  Same shape as `useWalking`: a ref holding the last value, `true` for exactly one
  `--dur-reward` cycle on a `false → true` flip, `false` on mount and on the reverse flip.
  If a later spec wants another "the learner just did X" animation on a value that is not
  already a boolean prop, reach for this hook rather than a fresh transient-state pattern.
- **The badge and banner need no transient state at all.** `data-just-completed` needed the
  hook because a *button* stays mounted through the toggle. The "Act cleared" badge and the
  "Shipped" banner do not exist in the DOM until their condition first goes true (`Section`'s
  `badge` prop and `Overview`'s `shipped` prop both render `null` otherwise), so a plain CSS
  `animation` on mount is the whole mechanism — nothing to clear, nothing that can replay on
  an unrelated re-render. This is the cheaper pattern whenever it applies; reach for the hook
  only when the element cannot be conditionally unmounted.
- **`TrackMap` derives `actCleared` and `shipped` off the same `progress` it already
  computes once via `computeTrackProgress`.** No second count exists anywhere. Both exclude
  frontier by construction, because `ActProgress`/`TrackProgress`'s own `done`/`total` already
  do (spec 09) — do not fold frontier into either condition later without re-reading why spec
  09 kept it separate.
- **`Section` gained a `badge` slot; `.section__kicker` moved inside a new `.section__head`
  flex row.** The badge is a sibling chip, not a child of the kicker's own ink pill — nesting
  it inside `.section__kicker` (the more obvious first attempt) renders one colourful chip
  crushed inside another's padding. If a later spec adds a second optional chip beside the
  title, it belongs in `.section__head` too.
- **`reward-stamp-in` is one keyframe shared by `.section__badge` and `.overview__shipped`.**
  Both set their own resting `transform` and end the keyframe on that exact value, so nothing
  jumps once the animation finishes. Keep that pairing if either value ever changes — an
  unmatched end frame is a visible snap, not a build failure, so nothing catches it but eyes.
- **This session also found, and deliberately did not fix, the actual cause of the "GitHub
  Pages is broken" report that opened this conversation.** `.github/workflows/pages.yml` was
  failing at `actions/configure-pages@v5` on every push (confirmed from the Actions API: the
  `Pages` workflow run has `conclusion: failure` at that step, while GitHub's separate legacy
  "pages build and deployment" run on the same commit succeeded) — because the repository's
  Pages source is still "Deploy from a branch" rather than "GitHub Actions", exactly what
  `BACKLOG.md` T131 already predicted after spec 12. That means the live site has been serving
  raw, unbuilt source through GitHub's own Jekyll-ish fallback, not `dist/` — a plausible
  explanation for "looks broken" on its own, independent of anything spec 14 changed. It is a
  repository-settings change (Settings → Pages → Build and deployment → Source →
  "GitHub Actions"), not a code fix, and stays outside this spec and this codebase's reach.

## 15 — Closing the content gap: a real AI-engineering branch

**State:** `IN PROGRESS` — claimed 2026-08-20  **Depends on:** 01–14

Opened directly by the project owner in conversation. Full rationale, the two reference
roadmaps fetched and compared, and the exact six nodes in
`specs/spec-15-ai-engineering-branch.md`.

## Change log

Newest first. One line per state change. Whoever changes a state writes the line.

- 2026-08-20 — Spec 15 claimed `IN PROGRESS`. Owner-directed: the registry has no RAG,
  vector database, agent framework, evals or local-model content, which is what every
  reference "AI Engineer" roadmap fetched this session leads with after prompting. Adding
  one frontier branch on the `app` track — six nodes, each a real repo verified live via
  the GitHub API this session. `specs/spec-15-ai-engineering-branch.md` has the full scope
  and the reasoning for staying inside the frontier-branch mechanism rather than a new
  main-road act or a `CONTEXT.md` amendment.
- 2026-08-20 — Spec 14 `DONE`. Completion payoff: a one-shot stamp on `Mark done`
  (`useJustCompleted` + `cards.css`), an "Act cleared" badge (`Section`'s new `badge` slot),
  a track-shipped banner on the overview plus an accent-filled masthead chip, and a reveal
  animation on expanding a below-level stub — all gated on real state transitions, none on
  render, no new colour or dependency. Verified in a real Chromium tab: every animation's
  `animation-name` read via `getComputedStyle` immediately after its triggering click, the
  "shipped" condition proven both false (one act cleared) and true (a full track seeded),
  no console errors. Build, typecheck and the theme gate (53 files, 61 tokens, 0 violations)
  all green. Nothing promoted — nothing depends on spec 14. Board is empty of
  `READY FOR DEVELOPMENT` work again.
- 2026-08-20 — Spec 14 claimed `IN PROGRESS`. Owner-directed, not board-driven: reward
  animations for marking a node done, clearing an act, and shipping a track, plus a
  progressive-disclosure reveal for expanding a below-level stub. `specs/spec-14-completion-
  payoff.md` has the full scope. Also found and logged separately (not part of this spec):
  the deployed GitHub Pages site is broken because the repo's Pages source is set to "Deploy
  from a branch" instead of "GitHub Actions," so the `Pages` workflow fails at
  `actions/configure-pages@v5` and GitHub's legacy build serves raw source instead of `dist/`.
- 2026-08-19 — Spec 12 `DONE`. Ship: a source gate (`check:theme`) failing the build on a
  colour literal, a type literal, a banned construct or an undeclared token outside
  `theme.css`, an output gate (`check:output`) failing it on a missing deploy file, a shipped
  sourcemap, an absolute asset path, a section 8 utility class or a gradient in `dist/`, both
  in the `build` chain, plus `public/404.html`, `public/.nojekyll` and a Pages workflow that
  runs `npm run build` verbatim. Phase B `DONE` — 12 of 12 specs written. Nothing promoted:
  spec 12 was the last one. **The board is complete; nothing is `READY FOR DEVELOPMENT`.**
- 2026-08-18 — Spec 11 `DONE`. Progress portability: a `Progress file` dialog on both
  screens exporting the completed ids and the intake to dated JSON, importing one back
  through a total parser with five stated refusals and a size cap, and a two-step reset.
  Spec 12 promoted `SPEC PENDING` → `READY FOR DEVELOPMENT` — every dependency, 01 to 11, is
  now `DONE`. It is the last spec.
- 2026-08-18 — Spec 10 `DONE`. Act navigation and the overview map: the track shows one act
  at a time with a nav strip, a named pager and a "you are in" jump, plus a zoomed-out
  overview listing every act with its own miniature clipped to its own progress. Nothing
  promoted — spec 11 was already `READY FOR DEVELOPMENT`, and spec 12 stays `SPEC PENDING`
  until 11 lands.
- 2026-08-18 — Spec 09 `DONE`. The frontier branch: 21 spurs rendered under their acts,
  dashed and marked unproven, with hollow dots, anchor rings and their own explored tallies;
  demotion derived from `last_commit` with a linked successor. Spec 10 promoted `SPEC
  PENDING` → `READY FOR DEVELOPMENT` (deps 04, 08, 09 all now `DONE`). Spec 12 stays `SPEC
  PENDING` — it needs 10 and 11.
- 2026-08-18 — Phase A `DONE`. Registry: 67 nodes, 44 main / 23 frontier, 98 URLs verified 200.
- 2026-08-18 — Registry revised: freshness rule applied literally, `core` 61 → 25, `emerging` 6 → 42.
- 2026-08-18 — Phase B opened. Twelve spec titles approved. All specs `SPEC PENDING`.
- 2026-08-18 — Repo put under git; Phase A files committed as `a787113`.
- 2026-08-18 — Legend clarified: the claiming session writes the spec file, so a spec is
  claimable on its dependencies alone. The old reading deadlocked the board.
- 2026-08-18 — Spec 01 `DONE`. Types, 32-rule validator, loader, and the minimal toolchain.
  Registry validates 0 errors / 0 warnings; `npm run build` now gated on it.
- 2026-08-18 — Spec 02 `SPEC PENDING` → `READY FOR DEVELOPMENT`, its only dependency landed.
- 2026-08-18 — Spec 02 `DONE`. Shell, theme, Section pattern, and the track-index screen.
  Specs 03 and 04 promoted `SPEC PENDING` → `READY FOR DEVELOPMENT` (deps 01, 02 both `DONE`).
- 2026-08-18 — Spec 03 `DONE`. Intake screen (track + level), localStorage persistence,
  change flow. No spec's dependencies changed — nothing else depends on 03 alone.
- 2026-08-18 — Spec 04 `DONE`. Path engine: `usePathPoint`, one `<svg>`/`<path>` per act,
  plain dots. Specs 05 and 07 promoted `SPEC PENDING` → `READY FOR DEVELOPMENT` (deps 01, 04
  and 04 respectively, both now `DONE`).
- 2026-08-18 — Spec 08 `DONE`. Progress in localStorage, fog of war and the walked stroke
  as two dash-clipped paths on the act's own `d`, and the character tweening to the frontier.
  Spec 11 promoted `SPEC PENDING` → `READY FOR DEVELOPMENT` (its only dependency, 08, landed).
- 2026-08-18 — Spec 05 `DONE`. Node cards positioned in the path's pockets, level-filter
  stubs, inert completion toggle for spec 08 to wire up. Spec 06 promoted `SPEC PENDING` →
  `READY FOR DEVELOPMENT` (deps 01, 05 both now `DONE`). Spec 08 still `SPEC PENDING` — 07
  has not landed.
- 2026-08-18 — Spec 06 `DONE`. Node detail panel: native controlled `<dialog>`, links
  grouped by `kind`, star/commit/status/note metadata, no prose. No spec's dependencies
  changed — nothing else depends on 06 alone; spec 07 was already `READY FOR DEVELOPMENT`
  and spec 08 still waits on it.
- 2026-08-18 — Spec 07 `DONE`. The character: frozen `t`/`facing`/`variant` props, a
  code-drawn three-layer placeholder positioned by `usePathPoint`, and a two-state bob
  gated on `t` actually changing. Spec 08 promoted `SPEC PENDING` → `READY FOR
  DEVELOPMENT` (deps 04, 05, 07 all now `DONE`). Spec 09 promoted too — its deps (04, 05)
  had been `DONE` since spec 05 landed and that cascade was missed at the time.
- 2026-08-19 — Spec 13 `DONE`. The paper-roadmap overhaul: `CONTEXT.md` section 8 amended by
  the owner, Gabarito + Space Grotesk vendored and Instrument Serif retired, the act curves
  rewritten portrait, a scoring pocket solver so no card sits on the road at any width, card
  paper keyed to link kind, stop numbers on road and card, and the `LANE` brand a previous
  session injected through CSS removed. Verified across all four tracks, all six curve/count
  combinations and five viewport widths. No spec's dependencies changed — 13 is the last on
  the board.
