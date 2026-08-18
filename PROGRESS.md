# PROGRESS.md — per-session narrative log

Newest last. One entry per session. `State of the project.md` is the status board;
this file is the story of how it got there.

---

## Spec 01 — Types, schema, and data loading — 2026-08-18

**Did:** Put the repo under git (it was not a repository), then built the shared type
layer, a 32-rule registry validator, the loader, and the minimal Vite + React +
TypeScript toolchain. Wrote `specs/spec-01-schema.md` first, since no spec file existed.

**Decided:**

- The board was deadlocked. `State of the project.md` said a `SPEC PENDING` spec was not
  claimable, but no session was assigned to write spec files, so nothing could ever start.
  `prompts/02-ralph-loop.md` step 4 settles it: the claiming session writes the spec file.
  Updated the legend to say so rather than stopping with nothing delivered.
- Spec 01 owns the toolchain even though `State of the project.md` lists the scaffold under
  spec 02, because spec 01's definition of done is a passing `npm run build` and there was
  no build. The split is toolchain here, look there.
- Reading order got its own module, `src/data/order.ts`. The validator checks prerequisites
  against it and the loader hands the same order to the UI; two copies would let the map
  disagree with its own validation.
- Declared the five Node functions the CLI script needs in `scripts/node-shims.d.ts` instead
  of adding `@types/node`, keeping the dependency list at exactly what `CONTEXT.md` allows.

**Verified:** `npm run build` 0, `npx tsc --noEmit` 0, `npm run validate:data` 0 with
67 nodes / 4 tracks / 0 errors / 0 warnings. A 45-case corruption suite fires every one of
the 32 rule codes and confirms the validator never throws on garbage input. Loaded the app
in a real browser: `orderedNodeIds` returns 38 / 43 / 48 / 41, matching the per-track node
counts in `nodes.json`, and `getNode('no-such-id')` throws. Deliberately broke a `requires`
and confirmed `npm run build` exits 1, then restored the data and confirmed it is
byte-identical to commit `a787113`.

**Next iteration should know:** everything under "Next session should know" in the spec 01
notes in `State of the project.md`. The short version: `.ts` import extensions are
load-bearing, `types.ts` stays type-only with runtime values in `constants.ts`, spec 02
inherits this scaffold rather than creating one.

---

## Spec 02 — Visual shell: theme, type scale, app frame — 2026-08-18

**Did:** Picked up a claim already in progress (`03bc570 claim: spec 02` plus two `wip`
commits) with a clean working tree — a prior session had landed the spec file, vendored
fonts, `theme.css` tokens, and the Tailwind namespace resets in `index.css`, but had not
wired the `@tailwindcss/vite` plugin into `vite.config.ts` or written any component. Finished
the rest: `src/styles/base.css`, `src/styles/shell.css`, `Shell.tsx`, `Section.tsx`,
`App.tsx`, `main.tsx`, `assets.d.ts`, and the `index.html` meta/icon additions.

**Decided:** `Section`'s title renders at `--size-display`, not the same-named `--size-title`
— the latter fell short of acceptance criterion 11's 3× size-jump floor on real viewports.
Full reasoning and every other decision is in the spec 02 session notes in
`State of the project.md`; not duplicating it here.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped for every banned
pattern in `CONTEXT.md` section 8 across `src/`, `index.html`, and the built `dist/` CSS —
none found. Loaded the app in a real Chrome tab (`chrome-devtools` MCP): no console errors,
tab-focus produces a hard 2px accent outline on the skip link, 360px viewport has zero
horizontal overflow with the masthead meta wrapping under the wordmark, title/body font-size
ratio measured 3.23× in the live DOM, and `.shell` holds at `--frame-max` (1248px) on a
2560px viewport instead of growing unbounded.

**Next iteration should know:** everything under "Next session should know" in the spec 02
notes in `State of the project.md`. The short version: `--size-title` is intentionally
unused so far (reserved for a later sub-heading), `Shell` reads `registry`/`registryWarnings`
directly for its colophon line, and the current `.track-row` styling is for a *static* index
— spec 03 will very likely need to merge in interactive states rather than inherit it as-is.

---

## Spec 03 — Intake: track and level — 2026-08-18

**Did:** Built the first stateful, localStorage-backed screen: `data/intake.ts` (defensive
read/write/clear), `hooks/useIntake.ts`, `components/Intake.tsx` (track list + level list
on one screen, no wizard), `styles/intake.css`, and rewrote `App.tsx` to branch on stored
intake — none/editing shows `Intake`, stored shows a minimal confirmation with a "Change"
control in the masthead.

**Decided:** Merged the interactive-rows question `BACKLOG.md` T022 had flagged since spec
02 — `.track-row` became a `<button>`, reset and `--selected` modifier added to
`shell.css` since they extend a class spec 02 already owns, while the genuinely new level
list and controls got their own `intake.css`. `IntakeState` lives next to the storage
functions in `data/intake.ts`, not in `types.ts` (that file is registry-shape-only by its
own header). Full reasoning in the spec 03 session notes in `State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Full interactive pass in
a real Chrome tab: first-visit picker, selection highlighting, submit-and-swap with no
reload, reload-skips-to-confirmation, change-reopens-prefilled, resubmit-overwrites,
two flavors of corrupted `localStorage` both fall back to a clean picker with zero console
errors, no horizontal overflow at 360px, and a real `Tab` keypress confirmed the existing
`:focus-visible` accent ring applies to the new rows without a new focus style.

**Next iteration should know:** everything under "Next session should know" in the spec 03
notes in `State of the project.md`. Short version: the confirmation view in `App.tsx` is a
deliberate placeholder for spec 04 to replace outright; `resetIntake` exists but is unused
so far; the `roadmap:intake:v1` key should stay behind `loadIntake`/`saveIntake` if spec 11
ever needs to touch it; and verifying focus rings via the browser MCP needs a real `Tab`
keypress, not a synthetic `click` (Chromium applies a different, non-accent outline to the
latter).

---

## Spec 04 — The path engine — 2026-08-18

**Did:** Built the load-bearing position system `CONTEXT.md` section 9 describes: a pure
`pointAtT` function (`getPointAtLength` plus a clamped `atan2` sample for facing angle), a
`PathContext` + `usePathPoint` hook pair so every node under an act's `<path>` can read its
position without prop-threading, `ActPath` (one `<svg>`/`<path>` per act, measures total
length once on mount), `PathNode` (one bare dot plus a mono label), and `TrackMap` (one
`Section` per act). Rewrote `App.tsx`'s post-intake branch to render `TrackMap` in place of
the spec 03 placeholder confirmation.

**Decided:** Dot/line/label colour comes from `--text-secondary`/`--rule`, not `--accent` —
spec 02 spent the one accent hue on exactly three uses and every node here renders
identically, so it isn't "state" yet; `--accent` stays reserved for spec 08's completed-
progress glow. `usePathPoint` reads a `React.Context` rather than taking a ref as an
argument so a `TrackMap`/`ActPath` never has to thread a path ref through props per node,
while the underlying `pointAtT` stays a plain, context-free function later specs can reuse
without React. Full reasoning in the spec 04 session notes in `State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped every new file for
hardcoded colour/gradient/glow — none. In a real Chrome tab: 7 `<svg>` for `game` (one per
act, one `<path>` each), every dot a finite `translate(x y)` with no `NaN`/stale-zero at
first paint, computed fill/stroke never the accent colour, switching track via Change to
`portfolio` swapped to 8 `<svg>` with no leftover `game`-track act titles (clean unmount), no
horizontal overflow at 360px, zero console errors. Found and fixed one real bug by
screenshot, not by re-reading the spec: SVG's default `overflow: hidden` clipped a label
near `t = 1` past the `viewBox` edge — fixed with `overflow: visible` on `.path-map`.

**Next iteration should know:** everything under "Next session should know" in the spec 04
notes in `State of the project.md`. Short version: `pointAtT`/`PathContext`/`usePathPoint`
are the one position implementation — spec 07 (character) and spec 08 (fog/glow) must reuse
them, and spec 08's second path should reuse `act.path` as data rather than clone the
mounted DOM node; `TrackMap` renders every act unconditionally (no act nav yet, that's spec
10) so tracks with 7–8 acts are a long scroll right now, which is expected.

---

## Spec 05 — Node cards in the negative-space pockets — 2026-08-18

**Did:** Built `NodeCard` — a card or, below the learner's chosen level, a hairline stub —
positioned from the same `usePathPoint(placed.t)` call spec 04's `PathNode` makes, converted
to a percentage of the act's viewBox via a new `parseViewBoxSize`. Threaded a new `level`
prop from `App` through `TrackMap` into `ActPath`, which now wraps its `<svg>` in an
`.act-stage` container and renders one card per placed node in a sibling HTML overlay.
Added `cards.css`, including a narrow-viewport fallback that drops the pocket layout for a
plain stacked column below 640px.

**Decided:** Removed `PathNode`'s bare-dot title label rather than repositioning it —
screenshotting the first pass showed it sitting on top of the new card's own title at the
same point, and spec 04 had already flagged that label as provisional. The completion
toggle is local `useState`, not localStorage — spec 08 owns persistence and depends on this
spec, so the button/class-name contract is what it should land behind rather than this spec
reaching into storage it doesn't own. Full reasoning, including why pocket offset is a CSS
transform nudge rather than stored geometry, is in the spec 05 session notes in
`State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped every new/edited
file for hardcoded colour/gradient/glow — none. In a real Chrome tab: 26 cards for `game`'s
26 placed nodes at `beginner` (0 stubs), 25 of 26 collapsed to stubs at `advanced`; stub
expand/collapse round-tripped correctly (checked as two separate post-click reads, since a
click and a same-call DOM read can race the re-render); a real focused `Tab`+`Enter`
toggled "Mark done" to "Done" with computed accent colour; switching track cleared the old
track's cards with no stale DOM; zero console errors; no horizontal overflow at 360px on
either track.

**Next iteration should know:** everything under "Next session should know" in the spec 05
notes in `State of the project.md`. Short version: spec 08 replaces `NodeCard`'s completion
`useState` with a persisted hook behind the same markup; `ActPath` now requires a `level`
prop; `NodeCard` doesn't care whether a `PlacedNode` came from an act or a branch, so spec
09 (frontier) can likely reuse it directly rather than building a second card component.

---

## Spec 06 — The node panel: pointers, never content — 2026-08-18

**Did:** Built `NodePanel`, a native `<dialog>` controlled by an `open` prop rather than an
imperative handle, showing a node's title, level/status, star count and last commit (with an
`unverified` placeholder when either is `null`), `note` when present, and its links grouped
by `kind` in the `KINDS` display order already reserved in `constants.ts`. `NodeCard`'s
title is now a `<button>` that opens the card's own `NodePanel`; the stub's expand control
is unchanged. Added `src/styles/panel.css` for the dialog surface and `::backdrop`.

**Decided:** Controlled `<dialog>` over a ref-based imperative API so `Escape` (native
`close` event) and the explicit close button funnel through one `onClose`. Backdrop-click
detection checks `event.target === dialogRef.current`, which a click on inner content never
satisfies. Each card owns its own `<dialog>` rather than lifting "which panel is open" to
`TrackMap`/`App` — matches spec 05's precedent of card-local interaction state, and native
`<dialog>` already guarantees only one page-level modal regardless of how many exist in the
DOM. Full reasoning in the spec 06 session notes in `State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped every new/edited
file for hardcoded colour/gradient/glow/emoji — none. In a real Chrome tab: opening a full
card's title showed its panel with links correctly grouped and ordered, and correct
placeholders/note for a hosted-product node with `stars`/`last_commit` both `null`;
`Escape` closed the panel and returned focus to the title button; a backdrop click closed it
while a click on inner content did not; exactly one of 26 mounted dialogs was ever `open`;
no horizontal overflow at a 360px-equivalent emulated viewport; zero console errors.

**Next iteration should know:** everything under "Next session should know" in the spec 06
notes in `State of the project.md`. Short version: `NodePanel` takes a plain `Node`, so any
future spec needing a node's detail view outside `NodeCard` should reuse `NodeCard` rather
than rebuild panel wiring; `requires` (prerequisites) still isn't shown anywhere in the UI,
out of this spec's scope by the spec board description; `--size-title` is now used for the
first time, closing `BACKLOG.md` T021.

---

## Spec 07 — The character — 2026-08-18

**Did:** Put a walker on the path. `Character` takes the three props
`prompts/00-antigravity-assets.md` freezes — `t`, `facing`, `variant` — reads its position
from `usePathPoint(t)` and nothing else, and draws a code-drawn placeholder as three
stacked layers in the sprite compositing order (body → outfit → hair). `useWalking` derives
a walk state from `t` changing, so the two-state bob runs only while the figure is actually
moving. Supporting pieces: `facingFromAngle` in `pointAtT.ts`, `pointToPercent` in
`viewBox.ts` (now shared with `NodeCard`), `Facing`/`CharacterVariant` in `types.ts`, a
`characterT` prop plus an `.act-stage__path` wrapper in `ActPath`, and a `character`
placement prop in `TrackMap` that defaults to the first act at `t = 0`.

**Decided:** HTML layers, not SVG shapes — the sprite version is layered `background-image`
divs, so an SVG placeholder would have turned the swap into a positioning rewrite. `facing`
stays in the signature but is optional, defaulting to `facingFromAngle(point.angle)`, which
satisfies both the frozen prop list and `CONTEXT.md` section 9's "atan2 the delta for facing
direction". The bob is gated on `t` changing because a walk cycle on a standing figure is
ambient motion, which section 8 bans; gated, it is motion showing a state change, which
section 8 allows — and it is what the sprite prompt asks for anyway. `variant` is carried in
`data-*` attributes but not drawn: five skin tones would be five colours that are not in
`theme.css`. Full reasoning in the spec 07 session notes in `State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. No hardcoded colour, no
`--accent` use, no banned effect in any new or edited file. In a real Chrome tab: exactly
one character in the DOM per track, hosted by act 1, feet landing on the act's
`getPointAtLength(0)` to two decimal places at both 1440px and 360px, and clicks passing
straight through the overlay to the `<svg>` underneath. Modules imported off the dev server
to exercise the pure functions (`facingFromAngle` total over 14 angles including ±90;
`pointToPercent` returning 0 rather than `Infinity` on a zero-sized viewBox), plus throwaway
React roots to drive what the app itself cannot yet: a changing `t` (walk starts on the next
commit, restarts rather than stacks mid-settle, stops ~400ms after the last change, flips
facing on the leftward leg), a zero-node act (bare path, character still standing), and an
empty-`acts` track (renders nothing, no throw). The one real bug found in review: at 360px
the card overlay goes static and makes `.act-stage` far taller than the `<svg>`, which put
the character's feet at 104.6% of the path's height — fixed by giving the `<svg>` its own
wrapper for the character to inset against.

**Next iteration should know:** everything under "Next session should know" in the spec 07
notes in `State of the project.md`. Short version: spec 08's tween is the first thing that
will ever move `t`, and moving it is all that is needed to start the bob; drive it through
`TrackMap`'s `character` prop rather than editing `Character`; anything else that must stand
on the path belongs in `.act-stage__path`, not the card overlay; `pointToPercent` is the one
SVG-point → percentage conversion and should not be inlined a third time; and T060 records a
pre-existing spec 05 overflow of left-side cards at mid viewport widths.

## Spec 08 — Progress and fog of war — 2026-08-18

**Did:** Gave the map a memory. `src/data/progress.ts` holds both halves — a `localStorage`
reader/writer that mirrors `intake.ts` and never throws, and `computeTrackProgress`, the one
pure function that turns a set of completed node ids into everything the map draws about
progress. `ProgressContext` carries the set and its toggle to every card; `useProgress` owns
it in `App`; `useTweenedT` walks the character to the frontier on `requestAnimationFrame`.
`ActPath` gained two more `<path>` elements on the act's own `d` string, dash-clipped, and
`PathNode` gained a state. `NodeCard`'s completion toggle finally does something.

**Decided:** The two design calls both came out of looking at the running app rather than
the spec. First, the accent: painting the completed stretch in full `--accent` turned a
finished act into an unbroken orange line, so the strokes were reordered — the walked
stretch paints over the reached one in `--accent-quiet`, leaving exactly one short bright
segment between what is finished and where the learner stands. That is section 8's "accent
means *here*, not decoration" taken literally, and it retires `--accent-quiet` from the list
of tokens declared but never used. Second, `current`: scoping it per act lit the first dot
of every act the learner had not reached, so it is now scoped to the track and exactly one
dot carries it. Beyond that: progress is one flat set shared across tracks because the
registry is one flat node list; unknown ids in storage are kept rather than filtered, since
section 6 never deletes a node; and the strokes draw an act's completed *prefix*, so an
out-of-order completion lights its own dot and leaves the line alone — a display of what
happened, not a rule about what is allowed. Full reasoning in the spec 08 session notes in
`State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. A 52-assertion suite ran
`computeTrackProgress` over all four real tracks against ~20 completion subsets each, plus
synthetic tracks with no acts, an empty act, one node, out-of-order completions and
deliberately non-monotonic / out-of-range / `NaN` `t` values — and was itself checked by
breaking an invariant and watching it fail. In a real Chrome tab: persistence both
directions across reloads, cross-track completion with no second write, twelve malformed
storage values and a `localStorage` stubbed to throw all degrading cleanly, per-frame
sampling of the walk (snaps on mount, retargets mid-walk without restarting, enters a new
act at exactly `t = 0`), the reduced-motion snap, a fully completed track, `advanced` level
where the frontier sits on a collapsed stub, 360px, and a throwaway React root for the
zero-act and zero-node-act cases. Zero console errors or warnings.

**Found in review, then fixed:** three things, none of which the first build got wrong on
paper. The per-act `current` scoping and the accent inversion above, both caught by
screenshotting rather than reading. And a one-frame artifact crossing an act boundary — the
walker painted the old act's `t` against the new act's geometry for a single frame, because
the reset lived in an effect; moving it into the render pass fixed it, and per-frame
sampling confirmed the first frame on the new act is now the path's start exactly. A fourth
change was performance, not correctness: the tween re-rendered all seven acts every frame
(45fps against 62 idle), so `ActPath` is memoised, which puts it back to 56fps.

**Next iteration should know:** everything under "Next session should know" in the spec 08
notes in `State of the project.md`. Short version: `computeTrackProgress` is the single
place progress may be decided, and spec 09 should extend it rather than compute beside it
when branch nodes arrive — they are excluded here deliberately. `ActPath` is now wrapped in
`memo`, so any prop a later spec adds must be referentially stable across a tween frame.
`ProgressContext` must wrap anything rendering a `NodeCard`; its reader throws outside a
provider on purpose. Spec 07's `TrackMap.character` override still works — the frontier is
only the fallback. Specs 09 and 11 are both claimable now.
## Spec 09 — The frontier branch — 2026-08-18

**Did:** Drew the 23 frontier nodes the registry has always held and nothing had ever
rendered. Each of the 21 `Branch` entries in `tracks.json` now renders as its own spur under
the act that holds its anchor: a head naming that anchor and the branch's own `n / m
explored`, a dashed hairline path marked unproven, hollow dots that fill when a node is
finished, and the cards below. The anchor's dot on the main road wears a hairline ring so
the spur reads as leaving from somewhere. The spec's second half is demotion:
`src/data/dormancy.ts` applies `CONTEXT.md` section 6's twelve-month rule to `last_commit`
at render time, a dormant card greys out and says so, and an optional `successor` node id
(new on `Node`, validated three ways) prints on the card and links out through the
successor's own registry link in the panel.

**Decided:** Two calls came from measuring rather than reading. First, the branch is a block
below its act, not a line drawn out of the anchor dot — a branch's viewBox is `0 0 640 320`
against an act's `0 0 1200 760`, and faking a transform between them would have fought the
card overlay for the same pixels; the attachment is stated in the head and marked with the
ring instead. Second, and this replaced the first build: branch cards stack below the spur
rather than floating in its pockets, because the largest spur in the registry places seven
nodes on that 320-unit box and no stage width makes seven cards fit. Beyond that: unproven
is dashes, not colour; dormancy is derived from dates, never typed into the registry; on a
dot `current` beats dormancy beats completion; and the frontier is counted beside the road
(`· n / m FRONTIER` in the masthead, `n / m explored` per spur) and never folded into
`n / m DONE`, which answers the question spec 08 deliberately left open. Full reasoning in
the spec 09 session notes in `State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0; the registry still
validates 0 errors / 0 warnings. An 824-assertion suite over all four real tracks and five
completion subsets each, plus synthetic tracks (no branches, empty branch, branch on a
missing act, act with no nodes), confirms branch slices, the frontier tally, untouched road
totals and anchors landing on the act that actually places them — and the suite was checked
against deliberately wrong expectations to prove it can fail. Nine `dormancyOf` cases and
five validator mutations cover the rest of the logic. In a real Chrome tab: all 21 spurs in
the right sections in `track.branches` order, anchor rings on exactly the distinct anchors,
dot positions matching `getPointAtLength` to two decimals, tallies and persistence, panels
and stubs from branch cards, a geometric overlap scan reporting zero across four tracks,
three levels and two viewports, dormancy exercised against a patched-then-restored
`nodes.json`, and 55fps mid-tween with zero mutations inside a branch subtree. Zero console
errors.

**Found in review, then fixed:** eight, listed in the spec 09 notes. The one worth repeating
is that the first branch layout was wrong in a way reading could not catch: it inherited the
act's pocket positioning, which quietly overlapped cards on `portfolio` and could never have
worked for `app`'s seven-node spur. Two rounds of widening the stage were treating symptoms;
stacking the cards was the fix.

**Next iteration should know:** everything under "Next session should know" in the spec 09
notes in `State of the project.md`. Short version: `computeTrackProgress` now decides
branches too and must not be recomputed beside; `usePathLength` is the only path
measurement, so spec 10's overview map should use it; `.act-stage--branch`'s stacked layout
is load-bearing and the numbers behind it are in `branch.css`; `dormancyOf` reads the clock,
so the map's appearance genuinely changes with the date; and nothing in the registry is
dormant today, so those paths live only against patched data until a real tool dies.

---

## Spec 10 — Act navigation and the overview map — 2026-08-18

**Did:** Turned the track from one unbroken scroll into a place you move through. `TrackMap`
now renders exactly one act — its `Section`, its path, its cards, its spurs — framed by a nav
strip that says `Act 03 / 07` and offers the overview, and a pager at the foot that names the
act before and the act after. The map opens on the act the learner is standing in rather than
at act 01, and when they wander off it a control in the accent says "You are in 04 Tools" and
takes them back. The second half is the overview: every act of the track as a row with its
index, title, standfirst, `n / m done · n / m frontier`, and a miniature of that act's own
serpentine painted with that act's own progress — the whole road on one screen, any act one
click away. Three small pieces were lifted to make it honest: `dashToFraction` out of
`ActPath` into `src/path/dash.ts`, a per-act `frontier` tally into `computeTrackProgress`, and
all the view logic into a React-free `src/data/navigation.ts`.

**Decided:** The map opens at the bookmark, not the table of contents — `initialView` reads
the same placement the walker is drawn from, so the figure is on screen at mount. Marking a
node done never moves the view: finishing the act on screen advances the frontier to the next
act and the screen stays where the learner put it, which is why the "you are in" control
exists at all. Previous/next live only at the foot of the act and the overview is the random
access, so no control appears twice. The overview is a stack of hairline-ruled rows rather
than a grid of tiles (section 8 bans bento grids, and acts are a sequence), it draws no
connector between two miniatures whose curves do not meet, and it carries no dots — the row's
tally says what a six-dot miniature at 11rem could not. Hover marks a row in `--text-muted`
so the accent keeps meaning "here" and nothing else. Full reasoning in the spec 10 session
notes in `State of the project.md`.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0; the registry still validates
0 errors / 0 warnings. A 502-assertion suite over the four real tracks covers indices, refs,
neighbours, resolution, the unknown-id cases, `initialView` in four progress states, and the
per-act frontier tally against three completion subsets each — including that the tallies sum
to the track's and that branch completions leave the road untouched — and the suite was
checked against deliberately wrong expectations to prove it can fail. In a real Chrome tab: a
first run lands on act 01 with no other act in the DOM; the pager walks `game`'s seven acts
forward and back with the position tracking each step and the ends offering only one
direction; finishing the act on screen keeps the heading and raises the jump control;
`portfolio`'s overview tallies sum exactly to the masthead's counts; and every miniature's
dash clip equals its act's own strokes to three decimals. Five throwaway React roots cover no
acts, one act, an act with no nodes, an empty branch and a very long title. At 360x740
nothing overflows. Zero console errors.

**Found in review, then fixed:** six, listed in the spec 10 notes. The one worth repeating is
that the miniatures' first stroke rule used `vector-effect: non-scaling-stroke` to stay
visible when scaled down, and that quietly moved the dash pattern into device space too — a
3298-unit `stroke-dasharray` became 3298 device pixels against a ~480-pixel path, so every
miniature drew an arbitrary slice of itself in the accent while looking entirely plausible.
Reading the computed dash values against the measured length found it; the screenshot never
would have.

**Next iteration should know:** everything under "Next session should know" in the spec 10
notes in `State of the project.md`. Short version: there is no scroll target for an act any
more, so reach one through `selectAct`; the view lives in React state with no URL, hash or
storage key behind it (T105, T106 — spec 11 owns storage, spec 12 owns the Pages routing
question); `computeTrackProgress` decides progress including each act's spur tally; and a
fourth drawing of an act must reuse `usePathLength` and `dashToFraction` and must not put
`non-scaling-stroke` on a dash-clipped path.
