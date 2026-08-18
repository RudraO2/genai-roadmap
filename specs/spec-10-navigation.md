# Spec 10 — Act navigation and the overview map

**Depends on:** 04 (the path engine), 08 (progress and fog of war), 09 (the frontier branch)
**State:** `DONE` — 2026-08-18

---

## Goal

Make the map a place you move through instead of a single unbroken scroll. `CONTEXT.md`
section 9 says it plainly: "Each act is its own serpentine screen; a zoomed-out overview
chains the acts." Today `TrackMap` renders all seven or eight acts of a track one after
another, so the `game` track is one page metres long and the learner has no sense of where
they are in it. After this spec the map shows **one act at a time**, with a nav strip that
says which act of how many, a pager that walks to the act before or after, and an
**overview** screen that lists every act on the track — each drawn as a miniature of its own
serpentine, painted with the same progress strokes as the full-size map — so the whole road
is legible at once and any act is one click away.

---

## In scope

- A view state with two shapes: the overview, or one act of the current track.
- Landing on the act the learner is standing in (their progress frontier), not on act 01.
- A top nav strip: an **Overview** control, an `ACT 03 / 07` position, and — only when the
  act on screen is not the one the learner is standing in — a control that jumps back to it.
- A bottom pager naming the previous and next acts, hidden when there is no such act.
- The overview screen: every act as a row — index, title, road tally, frontier tally, and a
  miniature of the act's own path with the reached/walked strokes clipped to that act's
  progress. The whole row is the control that opens the act.
- Focus and scroll handling on navigation, so a keyboard or screen-reader user is moved to
  the new screen rather than left at the bottom of the old one.
- Extending `computeTrackProgress` with a per-act frontier tally, so the overview can state
  it without deciding progress a second time.
- Moving the existing `dashToFraction` helper out of `ActPath` into `src/path/` so the
  overview's miniatures clip with the same function rather than a copy of it.

## Out of scope

- **A URL, hash or history entry per act.** No router, no dependency, and `CONTEXT.md`
  section 10's static build has no server to resolve a path. The back button is not wired.
  Logged to `BACKLOG.md` for spec 12 to consider alongside the GitHub Pages 404 handling.
- **Persisting the viewed act to localStorage.** Progress is persisted; where you happen to
  be looking is not. Landing on the progress frontier is a better answer than restoring a
  scroll position, and it needs no new storage key. Spec 11 owns everything stored.
- **Keyboard shortcuts** (arrow keys, `[` / `]`). They would hijack scrolling on a page this
  tall for a gain the buttons already give.
- **Node dots or labels on the overview miniatures.** At ~11rem wide a 1200-unit act cannot
  carry six legible dots and no labels at all; the row's counts say what the dots would.
- **Any change to fog, cards, panels, the character or the branch layout.** This spec moves
  screens around; it does not touch what is drawn on one.
- **Zooming or panning the overview.** "Zoomed-out" is a fixed smaller drawing, not a
  gesture surface.

---

## Files

**New**

| Path | What |
| --- | --- |
| `src/data/navigation.ts` | View state, free of React: `ActView`, lookup, neighbours. |
| `src/path/dash.ts` | `dashToFraction`, lifted verbatim out of `ActPath.tsx`. |
| `src/components/ActNav.tsx` | The top strip: overview, position, "you are standing in" jump. |
| `src/components/ActPager.tsx` | The bottom pager: previous / next act, by name. |
| `src/components/Overview.tsx` | The overview screen, plus its private `ActMini` miniature. |
| `src/styles/navigation.css` | Classes for all three. `@layer components`, tokens only. |

**Changed**

| Path | Change |
| --- | --- |
| `src/components/TrackMap.tsx` | Holds the view; renders one act or the overview. |
| `src/components/ActPath.tsx` | Imports `dashToFraction` rather than declaring it. |
| `src/data/progress.ts` | `ActProgress` gains `frontier`, the act's own spur tally. |
| `src/index.css` | Imports `navigation.css`. |

`App.tsx` is not touched. Its masthead counts are track-wide and stay correct whatever act is
on screen.

---

## Interfaces

```ts
// src/data/navigation.ts

/** The map shows either the zoomed-out overview or exactly one act. */
export type ActView = { kind: 'overview' } | { kind: 'act'; actId: string }

export const OVERVIEW_VIEW: ActView

/** A neighbouring act, flattened for a button: no `Act` needed downstream. */
export interface ActRef {
  actId: string
  /** 1-based, as shown. */
  index: number
  title: string
}

export function actViewOf(actId: string): ActView

/** The two-digit act label every control prints: "01", "07". */
export function padIndex(index: number): string

/** -1 when the track does not hold that act. */
export function actIndexOf(track: Track, actId: string): number

/** The `ActRef` for one act id, or null when this track does not hold it. */
export function actRefOf(track: Track, actId: string): ActRef | null

/**
 * The act a view resolves to, or null for the overview — and also null for an
 * act id this track does not hold, so a view left over from another track falls
 * back to the overview instead of rendering nothing.
 */
export function resolveAct(track: Track, view: ActView): Act | null

export function neighbourActs(
  track: Track,
  actId: string,
): { prev: ActRef | null; next: ActRef | null }

/**
 * Where the map opens: the act the learner is standing in, else the first act,
 * else the overview when the track has no acts at all.
 */
export function initialView(track: Track, placement: CharacterPlacement | null): ActView
```

```ts
// src/path/dash.ts
export function dashToFraction(
  totalLength: number,
  fraction: number,
): { strokeDasharray: number; strokeDashoffset: number }
```

```ts
// src/data/progress.ts — added field
export interface ActProgress {
  // ...existing fields unchanged
  /**
   * The frontier spurs that render under this act, tallied together. Beside the
   * road, never in it: it takes no part in `done` / `total` or the fog.
   */
  frontier: { done: number; total: number }
}
```

```tsx
// src/components/ActNav.tsx
export interface ActNavProps {
  /** 1-based position of the act on screen. */
  index: number
  count: number
  onOverview: () => void
  /** The act the learner is standing in, when it is not the one on screen. */
  standing: ActRef | null
  onSelectAct: (actId: string) => void
}

// src/components/ActPager.tsx
export interface ActPagerProps {
  prev: ActRef | null
  next: ActRef | null
  onSelectAct: (actId: string) => void
}

// src/components/Overview.tsx
export interface OverviewProps {
  track: Track
  progress: TrackProgress
  /**
   * The act the walker stands in — the same value the act screen's own jump
   * control reads, so the two screens cannot mark different acts.
   */
  standingActId: string | null
  onSelectAct: (actId: string) => void
}
```

`TrackMapProps` is unchanged — `track`, `level`, and spec 07's optional `character`.

---

## Behaviour

1. **Opening the map** shows the act holding the learner's progress frontier
   (`progress.placement.actId`). A track with no placed nodes opens on its first act; a
   track with no acts opens on the overview.
2. **Overview → act.** Clicking a row opens that act.
3. **Act → overview.** The nav strip's Overview control.
4. **Act → act.** The pager, or the "you are standing in 04 Tools" control when the act on
   screen is not the frontier act.
5. **After any of those**, the window scrolls to the top and focus moves to the screen
   container (`tabIndex={-1}`), so the next Tab lands inside the new screen. On first mount
   nothing is focused and nothing scrolls.
6. **Marking a node done never changes the view.** Finishing the last node of the act on
   screen moves the learner's frontier to the next act, and the nav strip starts offering the
   jump to it. The screen does not move under the learner's cursor.
7. **The act screen renders exactly one act**: its `Section`, its `ActPath`, and the branches
   whose `act` names it — the same composition `TrackMap` renders today, filtered to one.

---

## Acceptance criteria

- [x] `npm run build` and `npx tsc --noEmit` both exit 0.
- [x] Opening a track with no progress shows act 01 only — one `Section`, one `.path-map`
      (plus its branches' maps), and no other act's `Section` in the DOM.
- [x] With progress that finishes acts 01–02, opening the track shows act 03.
- [x] The nav strip reads `ACT 03 / 08` on the third act of `portfolio`, and the two numbers
      match `track.acts` order and length on every act of every track.
- [x] The pager names the real neighbouring acts; on the first act it offers only next, on
      the last only previous, and on a one-act track it does not render at all.
- [x] The Overview control reaches the overview from any act, and every overview row opens
      the act it names.
- [x] The overview lists every act of the track in order, each with its index, title, road
      tally `n / m`, and — only when that act hosts a branch — its frontier tally.
- [x] Each overview miniature draws that act's own `path` string with the reached and walked
      strokes clipped to that act's `revealT` / `completeT`. A finished act's miniature is
      fully quiet-ember; an untouched act's is plain rule.
- [x] Exactly one overview row is marked as where the learner is standing, and it is the act
      `computeTrackProgress` places them in.
- [x] Marking a node done updates the act screen and the overview tallies without moving the
      view.
- [x] Navigating scrolls to the top and moves focus into the new screen; the first render
      does neither.
- [x] `getTotalLength` still appears exactly once in `src/` (inside `usePathLength`), and
      `getPointAtLength` only in `pointAtT.ts`. The overview measures through the hook.
- [x] `dashToFraction` is declared once, in `src/path/dash.ts`, and imported by both
      `ActPath` and `Overview`.
- [x] `computeTrackProgress` is still the only function that decides progress: the overview
      reads `ActProgress`, including the new `frontier` tally, and counts nothing itself.
- [x] No hex, `rgb(`, `hsl(`, gradient, `backdrop-filter`, coloured `box-shadow`, blur,
      default Tailwind palette token or emoji in any file this spec touches.
- [x] Every colour and type value in `navigation.css` is a `var(--…)` from `theme.css`.
- [x] At a 360px viewport the nav strip, the pager and the overview rows wrap rather than
      overflow: `document.documentElement.scrollWidth <= window.innerWidth`.
- [x] Edge cases do not throw: a track with no acts, an act with no nodes, a one-act track, a
      view naming an act the track does not hold, and a very long act title.
- [x] `State of the project.md`, `BACKLOG.md` and `PROGRESS.md` all updated; committed with
      the spec number.

---

## Decisions taken up front

- **The overview is a stack of rows, not a grid of tiles.** `CONTEXT.md` section 8 bans bento
  grids outright, and a single hairline-ruled column in index order is both the editorial
  form and the honest one: the acts are a sequence.
- **No invented connector between the miniatures.** Act curves start and end at different
  corners (`long` ends at x=130, `medium` at x=1070), so a line drawn between two rows would
  be decoration pretending to be geometry. The chain is the stack order and the progress
  painted continuously across it.
- **Prev/next live at the bottom, not in both bars.** One control per job. The position
  indicator answers "where am I" at the top; the road is walked forward, so the way onward
  belongs at the end of the act. Random access is the overview's job.
- **Hover and "here" must not look alike.** A row's hover marker is `--text-muted`; the
  accent left marker is reserved for the act the learner is standing in. Accent means here
  (section 8), and it would say nothing if the pointer could also produce it.

---

## Built, in one line each

- `initialView` reads `character ?? progress.placement`, so the map opens on the act the
  walker is actually drawn in, override included.
- The overview's marked row and the nav strip's jump control both read one `standingActId`
  handed down from `TrackMap`, rather than deriving it twice.
- The miniatures' stroke is widened in **user units**, not with
  `vector-effect: non-scaling-stroke` — that moves the dash pattern into device space and
  the progress clip stops meaning anything (found in review; see the spec 10 session notes).
- `padIndex` is shared by all four places that print a two-digit act number.
