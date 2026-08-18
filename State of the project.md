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
| B | Write the specs → `specs/*.md` | `IN PROGRESS` — folded into each spec's own session; 7 of 12 written |
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
| 08 | `specs/spec-08-progress.md` | `READY FOR DEVELOPMENT` | 04, 05, 07 |
| 09 | `specs/spec-09-frontier.md` | `READY FOR DEVELOPMENT` | 04, 05 |
| 10 | `specs/spec-10-navigation.md` | `SPEC PENDING` | 04, 08, 09 |
| 11 | `specs/spec-11-portability.md` | `SPEC PENDING` | 08 |
| 12 | `specs/spec-12-ship.md` | `SPEC PENDING` | 01–11 |

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

**State:** `READY FOR DEVELOPMENT`  **Depends on:** 04, 05, 07

Mark a node complete or incomplete; persist to localStorage. Fog of war is
`stroke-dasharray` and `stroke-dashoffset` on the same path from spec 04. Completed glow is
a second path layered above, dash-clipped to progress. Character `t` tweens toward the
progress frontier.

**Watch for:** "completed glow" here means a second stroke, not a `box-shadow` with colour.
Section 8 bans glow shadows and neon halos outright.

---

## 09 — The frontier branch

**State:** `READY FOR DEVELOPMENT`  **Depends on:** 04, 05

Frontier nodes render as spurs off their `anchor` node, using the branch path geometry in
`tracks.json`. Visually distinct from the main path and explicitly marked unproven. 23 of
67 nodes live here.

Also renders demotion: a node with no commits in 12 months greys out and is marked dormant,
kept visible with its successor linked if one is known. Dead tools are useful information.
Nothing is ever deleted.

---

## 10 — Act navigation and the overview map

**State:** `SPEC PENDING`  **Depends on:** 04, 08, 09

Move between acts. Each act is its own serpentine screen. A zoomed-out overview chains the
acts into one map so the whole road is legible at once.

Act counts per track: game 7, app 6, portfolio 8, media 8.

---

## 11 — Progress portability

**State:** `SPEC PENDING`  **Depends on:** 08

Export progress to a JSON file, import it back, reset it. This is how a learner moves
between devices without an account. It is the entire sync story and it must stay that way.

**Watch for:** no backend, no auth, no database. If a task here starts describing a server
route, it has violated the constitution.

---

## 12 — Ship: build gates and GitHub Pages

**State:** `SPEC PENDING`  **Depends on:** 01–11

`npm run build` and `npx tsc --noEmit` wired as gates. A script that fails the build on any
hardcoded colour outside `theme.css`. GitHub Pages base path and 404 handling for a static
deploy.

---

## Deferred to v2 — do not build

Leaderboards, peer verification, guilds, social streaks, proof-of-work submission. All need
a backend. v1 is the map only. If one of these appears in a task, the task is wrong.

---

## Change log

Newest first. One line per state change. Whoever changes a state writes the line.

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
