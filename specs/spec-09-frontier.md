# Spec 09 — The frontier branch

**Depends on:** 04 (path engine: `pointAtT`, `PathContext`, `usePathPoint`, `ActPath`),
05 (`NodeCard`, its pocket positioning and its level stub)

## Goal

Render the 23 frontier nodes the registry already holds but nothing has ever drawn. Each
`Branch` in `tracks.json` is a spur off one main-path node — it carries its own `viewBox`,
its own path `d` and its own placed nodes — and it renders as its own small path under the
act that holds its anchor, marked unproven, visually distinct from the main road, with the
anchor named. The dot the branch leaves from is marked on the main path too, so the spur
reads as attached to a place rather than floating under an act.

Second half: demotion. `CONTEXT.md` section 6 makes it automatic — no commits in twelve
months and a node greys out and is marked dormant, kept visible, with its successor linked
if one is known. That is derived from `last_commit` against today, not typed by hand into
the data, so a node goes dormant on the day it earns it. Nothing is ever deleted.

## In scope

- `src/data/dormancy.ts` — new. One pure function, `dormancyOf(node, now)`, applying
  section 6's twelve-month rule to `last_commit` and honouring a `status` of `dormant` or
  `superseded` when the registry states it outright. No React, no clock reads at module
  scope.
- `src/types.ts` — an optional `successor?: string` on `Node`: the id of the node that
  replaced this one, for "its successor linked if one is known". A node id, never a URL, so
  it invents nothing.
- `src/data/validate.ts` — three rules for that field: it must be a string when present, it
  must name a node in the registry (`UNKNOWN_SUCCESSOR`), and it must not name itself
  (`SELF_SUCCESSOR`). Plus one warning, `EMPTY_BRANCH`, for a branch that places no nodes:
  the map does not draw one, and a thing that is not drawn has to be said out loud.
- `src/data/progress.ts` — `computeTrackProgress` extended, not duplicated: a
  `BranchProgress` per branch, a track-level `frontier` tally, and the set of anchor ids on
  each `ActProgress` so the anchor dot can be marked without a second pass over
  `track.branches`.
- `src/hooks/usePathLength.ts` — new. The measure-once-on-mount logic currently inline in
  `ActPath`, lifted so `BranchPath` measures its own path the same way. One implementation
  of "measure a path and provide it", as spec 04 intended.
- `src/components/BranchPath.tsx` — new, memoised. One branch: a head naming the anchor and
  the branch's own explored tally, its `<svg>` and single dashed stroke, its dots, and its
  cards listed below the spur. Reuses `PathContext`, `PathNode` and `NodeCard` — no second
  positioning code.
- `src/components/PathNode.tsx` — reads its node from the registry so a dot can draw its own
  zone and dormancy, plus an `anchor` prop for the ring that marks a spur's origin.
- `src/components/ActPath.tsx` — uses `usePathLength`; marks anchor dots from
  `progress.anchors`. No new prop, so the `memo` guarantees spec 08 established still hold.
- `src/components/TrackMap.tsx` — renders each act's branches inside that act's `Section`,
  after the act stage, in `track.branches` order.
- `src/components/NodeCard.tsx` — a dormant card greys out and says `dormant`; any card
  whose node names a successor prints it, dormant or not.
- `src/components/NodePanel.tsx` — a `Freshness` fact saying dormant or current, and a
  successor line linking to the successor's first registry link when it has one.
- `src/App.tsx` — the masthead prints the track's frontier tally beside its road tally,
  `n / m DONE · n / m FRONTIER`, so a completed spur node is counted somewhere without
  being counted into the road.
- `src/styles/branch.css` — new. The branch block: its rule, its head, its dashed stroke.
- `src/styles/path.css` — the frontier dot, the anchor ring, the dormant dot.
- `src/styles/cards.css` — `.node-card--dormant` and the successor line.
- `src/styles/panel.css` — the successor line in the panel.
- `src/index.css` — imports `branch.css`.

## Out of scope

- **Graduation.** Section 6's promotion rule (≥ 90 days indexed, commits inside 60 days,
  ≥ 1000 stars or clear velocity) decides what `zone` a node is *written* with. It is a
  research-time judgement over data this app does not have — star velocity is not in
  `nodes.json` — so it belongs to a registry revision, not to a render. This spec draws
  the zone the data states.
- **Editing the registry.** No node changes `zone`, `status` or gains a `successor` in this
  session. The field and the rendering exist; the data that uses them arrives when a tool
  actually goes dormant. Section 6 forbids deleting anything, and this spec deletes nothing.
- **Branch nodes in the act's fog, the walker's frontier, or the road's count.** A branch is
  explicitly off the main path. Counting it into `n / m DONE` would make the main road's
  progress depend on optional side trips. Each branch shows its own tally, and the masthead
  prints the track's frontier total *beside* the road's, never inside it.
- **A branch drawn in the act's own coordinate space.** See "Decided" below.
- **Act navigation and the overview map.** Spec 10.
- **Export/import/reset.** Spec 11.
- **A second `getTotalLength` implementation, a cloned path node, or an x/y stored on a
  placed node.** Branch nodes are `t` on a path exactly as act nodes are.

## Files

| File | Change |
| --- | --- |
| `src/data/dormancy.ts` | New — `dormancyOf`, the twelve-month rule |
| `src/types.ts` | `successor?: string` on `Node` |
| `src/data/validate.ts` | `successor` type / unknown / self rules |
| `src/data/progress.ts` | `BranchProgress`, `frontier` tally, `ActProgress.anchors` |
| `src/hooks/usePathLength.ts` | New — measure once, provide `PathContextValue` |
| `src/components/BranchPath.tsx` | New — one branch, memoised |
| `src/components/PathNode.tsx` | Registry-read zone/dormancy, `anchor` prop |
| `src/components/ActPath.tsx` | Uses `usePathLength`; marks anchor dots |
| `src/components/TrackMap.tsx` | Renders branches under their act |
| `src/components/NodeCard.tsx` | Dormant styling, dormant marker, successor line |
| `src/components/NodePanel.tsx` | Freshness fact, successor link |
| `src/App.tsx` | `· n / m FRONTIER` beside the masthead's road count |
| `src/styles/branch.css` | New |
| `src/styles/path.css` | Frontier dot, anchor ring, dormant dot |
| `src/styles/cards.css` | Dormant card, successor line |
| `src/styles/panel.css` | Successor line |
| `src/index.css` | One import |

No new dependency.

## Interfaces

```ts
// src/data/dormancy.ts
export interface Dormancy {
  /** Greyed out and marked dormant. `declared || stale`. */
  dormant: boolean
  /** The registry says so: `status` is `dormant` or `superseded`. */
  declared: boolean
  /** `last_commit` is older than DORMANT_AFTER_DAYS (365). */
  stale: boolean
  /** Whole days since `last_commit`, or null when there is no date to measure. */
  daysSinceCommit: number | null
}

/** @param now Milliseconds since epoch. Injected so the rule is testable. */
export function dormancyOf(node: Node, now?: number): Dormancy
```

```ts
// src/types.ts
export interface Node {
  // ...unchanged
  /** Node id that replaced this one. Section 6: link the successor if one is known. */
  successor?: string
}
```

```ts
// src/data/progress.ts
export interface BranchProgress {
  /** `complete` or `ahead` only. A branch never carries the track's `current`. */
  states: ReadonlyMap<string, NodeProgressState>
  done: number
  total: number
}

export interface ActProgress {
  // ...unchanged
  /** Ids of this act's nodes that a branch spurs off. */
  anchors: ReadonlySet<string>
}

export interface TrackProgress {
  // ...unchanged
  /** Keyed by `branch.id`. */
  branches: ReadonlyMap<string, BranchProgress>
  /** Branch totals for the whole track. Never folded into `done` / `total`. */
  frontier: { done: number; total: number }
}

export const EMPTY_BRANCH_PROGRESS: BranchProgress
```

```ts
// src/hooks/usePathLength.ts
export interface PathMeasure {
  pathRef: RefObject<SVGPathElement | null>
  /** 0 until the layout effect has run. Callers must gate rendering on it. */
  totalLength: number
  /** Referentially stable between measurements; hand straight to PathContext. */
  contextValue: PathContextValue
}

export function usePathLength(d: string): PathMeasure
```

```tsx
// src/components/BranchPath.tsx
export interface BranchPathProps {
  branch: Branch
  level: Level
  progress: BranchProgress
}
export const BranchPath: (props: BranchPathProps) => ReactNode // memoised

// src/components/PathNode.tsx
export interface PathNodeProps {
  placed: PlacedNode
  state: NodeProgressState
  /** A branch spurs off this node: draw the ring that says so. */
  anchor?: boolean
}
```

## Decided

- **A branch renders under its act, not on top of it.** A branch carries its own `viewBox`
  (`0 0 640 320`) and its own path; the act's is `0 0 1200 760`. There is no shared
  coordinate space, so drawing the spur out of the anchor's actual point would mean
  inventing a transform between two unrelated viewBoxes and then fighting the card overlay
  for the same pixels. The spur is instead its own block below the act's stage, indented
  behind a hairline, headed with the anchor's title — attachment stated in words and marked
  by a ring on the anchor dot, rather than faked in geometry that would break at the first
  viewport change.
- **Unproven is drawn, not decorated.** The branch stroke is the same `--rule` hairline as
  the road, dashed. Dashes read as provisional and cost no colour; the accent stays spent on
  where the learner is standing (section 8).
- **A branch stacks its cards; it does not pocket them.** This one changed during review.
  The first build floated branch cards in the spur's negative space exactly as `ActPath`
  does, and measured overlaps: a `640x320` viewBox puts two opposite-side nodes ~20% of the
  stage apart vertically while their cards still overlap horizontally, and the largest spur
  in the registry (`app` / "Deeper tooling") places **seven** nodes on that same box, which
  no stage width fixes. So the spur is drawn as a diagram — order, dots, completion state,
  unproven dashes — and the cards read below it in placed order. It is the layout
  `cards.css` already falls back to under 640px, so there is one behaviour at every width
  instead of two.
- **On a dot, `current` beats dormancy beats completion.** A finished dead tool is still
  dead, and its completion is already stated on the card and in the counts; but exactly one
  dot on a track says "here", and the map must not lose it because the tool the learner is
  standing on stopped moving.
- **Branch nodes carry no `current`.** Exactly one dot on a track is the learner's position
  and it belongs on the main road. A branch is a side trip.

## Acceptance criteria

1. `npm run build` and `npx tsc --noEmit` both exit 0.
2. Every branch in `tracks.json` renders: 5 on `game`, 4 on `app`, 7 on `portfolio`, 5 on
   `media`, each inside the `Section` of the act named by `branch.act`, in
   `track.branches` order.
3. Each branch head names its anchor node's title and shows its own `done / total` tally,
   which changes when a branch node is marked done — as does the masthead's `FRONTIER`
   count, while its `DONE` count does not move.
4. Branch dots sit on the branch path at `getPointAtLength(total * t)` — the same call act
   dots make — and the cards read below the spur in placed order. No x/y is stored anywhere.
   No branch card overlaps another card, the branch head, or the edge of its own block, on
   any track, at any level, at 1440px or 360px.
5. The branch stroke is visually distinct from the main path (dashed) and no branch draws
   fog, a walked stroke, or a character.
6. On the main path, exactly the nodes that anchor a branch draw the anchor ring.
7. Marking a branch node done flips its card's button, turns its dot, advances that
   branch's tally, and persists across a reload — and does **not** move the act's fog, the
   walker, or the masthead `n / m DONE`.
8. Branch nodes below the learner's level collapse to the same stub `NodeCard` renders on
   the main path, and expand.
9. Clicking a branch node's title opens its `NodePanel` with its links.
10. `dormancyOf` is total: `status: 'dormant'` or `'superseded'` is dormant regardless of
    date; a `last_commit` older than 365 days is dormant; a `last_commit` inside 365 days is
    not; `last_commit: null` is not dormant and reports `daysSinceCommit: null`; an
    unparseable date does not throw and does not report stale.
11. A dormant node's card greys out, says `dormant`, and is still present and still
    completable — nothing is hidden or removed.
12. A dormant node with a known `successor` names it on the card and links it in the panel;
    one without a successor renders neither, and no empty label.
13. `validate.ts` errors on a `successor` that is not a string, names an unknown node, or
    names its own node — and the real registry still validates with 0 errors and 0 warnings.
14. No hardcoded colour, gradient, glow, glassmorphism, emoji, or default Tailwind palette
    token in any file this spec touches.
15. At 360px the branch block stacks like the act does (cards in flow, no horizontal
    overflow) and the page's `scrollWidth` does not exceed its `clientWidth`.
16. Edge cases render without throwing: a branch with one node, a branch whose nodes are all
    below the learner's level, an act with several branches, and a track with no branches at
    all. A branch that places no nodes draws nothing and is reported by the validator as
    `EMPTY_BRANCH`.
