# Spec 08 — Progress and fog of war

**Depends on:** 04 (path engine: `pointAtT`, `PathContext`, `usePathPoint`, `ActPath`),
05 (`NodeCard` and its inert completion toggle), 07 (`Character`, `useWalking`, `TrackMap`'s
`character` prop)

## Goal

Make the map remember. A learner marks a node complete, the choice survives a reload, and
three things follow from it without a second source of truth: the act's path lights up
behind them (fog of war — `stroke-dasharray` + `stroke-dashoffset`), the completed stretch
is drawn again in the accent (a second stroke, never a coloured shadow), and the character
walks from where it stood to the first node the learner has not finished yet. Progress is a
flat set of node ids in `localStorage`, exactly as the registry is a flat set of nodes: a
node completed on one track is completed on every track that shares it.

Everything the map draws about progress is derived by one pure function from that set. No
component counts completions of its own.

## In scope

- `src/data/progress.ts` — new. Two halves, both pure of React:
  - **Storage**, mirroring `data/intake.ts` exactly: `loadCompleted`, `saveCompleted`,
    `clearCompleted`, keyed `roadmap:progress:v1`, never throwing on absent, disabled,
    malformed or hand-edited storage.
  - **Derivation**: `computeTrackProgress(track, completed)` → per-act reveal/complete
    positions, per-node state, the walker's placement, and the done/total counts.
- `src/data/ProgressContext.ts` — new. The context carrying `{ completed, toggle }` down to
  every `NodeCard`, plus its `useProgressContext()` reader. Same split as
  `PathContext.ts` / `usePathPoint.ts`.
- `src/hooks/useProgress.ts` — new. React-state wrapper over the storage half so a write
  re-renders without a reload. Same shape as `useIntake`.
- `src/hooks/useTweenedT.ts` — new. `useTweenedT(target, resetKey)` returns a `t` that
  walks to `target` at constant speed on `requestAnimationFrame`. Snaps (no tween) on
  mount, when `resetKey` changes the act it starts from that act's `t = 0`, and it snaps
  outright under `prefers-reduced-motion: reduce`.
- `src/components/ActPath.tsx` — a `progress: ActProgress` prop. Renders two further
  `<path>` elements with the same `d={act.path}`, dash-clipped to the act's reveal and
  complete positions, and hands each `PathNode` its state.
- `src/components/PathNode.tsx` — a `state: NodeProgressState` prop on the dot.
- `src/components/NodeCard.tsx` — the completion toggle reads and writes the shared
  progress instead of local `useState`. Markup, class names, `aria-pressed` and the
  "Mark done" ↔ "Done" label pair are unchanged.
- `src/components/TrackMap.tsx` — derives `TrackProgress` from the context, tweens the
  walker's `t` toward the frontier, and distributes each act's slice to its `ActPath`. The
  existing `character` prop keeps working as an explicit override.
- `src/App.tsx` — owns `useProgress()`, provides the context, and prints `n / m DONE` in
  the masthead beside the existing "Change track / level" control.
- `src/styles/path.css` — the two new strokes, the three dot states, and the transition
  that lets the strokes grow when progress changes. `base.css` already collapses every
  duration under `prefers-reduced-motion: reduce`, so this file adds no second rule for it.

## Out of scope

- **Export, import, and reset.** Spec 11 owns all three. This spec writes the storage
  functions it needs and no UI for clearing them; `clearCompleted` exists because storage
  modules that can only grow are a trap, not because anything calls it yet.
- **Branch (frontier) nodes.** Spec 09 renders them. They are not on any act's path, so
  they take no part in an act's fog geometry and no part in the frontier here. A branch
  node's id sitting in the completed set is preserved untouched.
- **Act navigation, scroll-to-frontier, or an overview map.** Spec 10.
- **Per-track progress.** One flat set, matching the flat registry. A track-scoped
  variant would mean the same node holding two truths.
- **Prerequisite gating.** Nothing stops a learner marking node 4 done before node 1. The
  path lights up contiguously from the act's start, so an out-of-order completion shows on
  its own dot without moving the line — that is a display of what happened, not a rule.
- **A second position implementation.** The new strokes reuse `act.path`, the string
  already on `Act`. Nothing clones the mounted node or measures a second length.

## Files

| File | Change |
| --- | --- |
| `src/data/progress.ts` | New — storage plus `computeTrackProgress` |
| `src/data/ProgressContext.ts` | New — context and `useProgressContext` |
| `src/hooks/useProgress.ts` | New |
| `src/hooks/useTweenedT.ts` | New |
| `src/components/ActPath.tsx` | `progress` prop; trail and glow strokes; node state |
| `src/components/PathNode.tsx` | `state` prop |
| `src/components/NodeCard.tsx` | Completion from context, not `useState` |
| `src/components/TrackMap.tsx` | Derivation, tween, per-act distribution |
| `src/App.tsx` | Owns progress, provides context, masthead count |
| `src/styles/path.css` | Two strokes, three dot states, one transition |

No new stylesheet, so `src/index.css` is untouched. No new dependency.

## Interfaces

```ts
// src/data/progress.ts
export const PROGRESS_KEY = 'roadmap:progress:v1'

export function loadCompleted(): Set<string>
export function saveCompleted(completed: ReadonlySet<string>): void
export function clearCompleted(): void

export type NodeProgressState = 'complete' | 'current' | 'ahead'

export interface ActProgress {
  /** 0-1. Path drawn as reached. See "the derivation, stated exactly" below. */
  revealT: number
  /** 0-1. Path drawn as done: the act's completed run from its own start. */
  completeT: number
  /** Every placed node in the act, by id. */
  states: ReadonlyMap<string, NodeProgressState>
  done: number
  total: number
}

export interface TrackProgress {
  acts: ReadonlyMap<string, ActProgress>
  /** Where the walker belongs: the first act holding an incomplete node, at its
   *  `revealT`. Null only when the track has no placed nodes at all. */
  placement: { actId: string; t: number } | null
  done: number
  total: number
}

export function computeTrackProgress(
  track: Track,
  completed: ReadonlySet<string>,
): TrackProgress

/** The empty act's slice, so a caller never branches on `undefined`. */
export const EMPTY_ACT_PROGRESS: ActProgress

// src/data/ProgressContext.ts
export interface ProgressContextValue {
  completed: ReadonlySet<string>
  toggle: (id: string) => void
}
export const ProgressContext: React.Context<ProgressContextValue | null>
/** Throws outside a provider rather than silently rendering an empty map. */
export function useProgressContext(): ProgressContextValue

// src/hooks/useProgress.ts
export interface UseProgress {
  completed: ReadonlySet<string>
  toggle: (id: string) => void
  resetProgress: () => void
}
export function useProgress(): UseProgress

// src/hooks/useTweenedT.ts
/** Milliseconds to walk the whole path, t = 0 to t = 1. */
export const TWEEN_MS_PER_T = 2400
export const TWEEN_MIN_MS = 180
export const TWEEN_MAX_MS = 1200
export function useTweenedT(target: number, resetKey: string): number

// src/components/PathNode.tsx
export interface PathNodeProps {
  placed: PlacedNode
  state: NodeProgressState
}

// src/components/ActPath.tsx
export interface ActPathProps {
  act: Act
  level: Level
  progress: ActProgress
  characterT?: number | null
}

// src/components/TrackMap.tsx  (character prop unchanged from spec 07)
export interface TrackMapProps {
  track: Track
  level: Level
  character?: CharacterPlacement
}
```

### The derivation, stated exactly

For one act, over its `nodes` in array order (the same order `data/order.ts` reads, and the
order the validator checks prerequisites against):

- `completeT` — the largest `t` of the act's completed **prefix**: node 1, then node 2, and
  so on until the first node that is not complete. `0` when the first node is incomplete.
  When every node in the act is complete, `1` — the whole path is walked, including the
  run-out past the last node.
- `revealT` — how far the learner has walked into this act.
  - Every node complete: `1`.
  - This is the **frontier act** (the first act on the track still holding an unfinished
    node): the `t` of that first unfinished node, so the learner always sees the stretch
    they are standing on. Clamped up to `completeT`, so a non-monotonic `t` in the data
    can never draw the completed stroke past the reveal.
  - Any act beyond the frontier: `completeT`. An act the learner has not reached must not
    stub a trail out to its own first node.
- `states` — `complete` for any node in the set, `ahead` for the rest, and `current` for
  exactly one node on the whole track: the frontier act's first unfinished node. Scoping
  `current` per act instead lit the first dot of every unreached act, which reads as seven
  simultaneous "you are here"s.
- An act with no placed nodes gets `EMPTY_ACT_PROGRESS`: both positions `0`, no states,
  `0 / 0`. It is neither complete nor eligible to host the walker.

For the track: `placement` is the **first act that holds an incomplete node**, at that
act's `revealT`. When every placed node on the track is complete, it is the last act with
nodes, at `t = 1`. When the track has no placed nodes at all, it is `null` and no character
renders.

Only act nodes count. Branch nodes are unrendered until spec 09 and never enter `total`.

### The three strokes

All three are `<path d={act.path}>` inside the act's one `<svg>` — the same geometry
string, layered bottom to top. Only the first is measured; the other two read `totalLength`
off the same measurement.

| Class | Stroke | Length |
| --- | --- | --- |
| `.path-map__line` | `--rule` | Full. The road, unchanged from spec 04. |
| `.path-map__reached` | `--accent` | `dashoffset = L * (1 - revealT)`. As far as they got. |
| `.path-map__walked` | `--accent-quiet` | `dashoffset = L * (1 - completeT)`. Behind them. |

`stroke-dasharray` is `L` on both clipped strokes, which makes the visible dash exactly
`[0, L * fraction]`. All three carry the same `stroke-width`, so the top stroke covers the
one beneath it rather than fringing it — every colour change lands on a hard edge, with no
halo and nothing that could be mistaken for a glow shadow.

**The order is the point.** `walked` paints over `reached`, so the only full-strength
accent left anywhere on the track is the short segment between the finished stretch and
where the learner is standing — the character stands at its far end. That is section 8's
"accent means *here*, not decoration", read literally. Painting completion itself in full
accent was the first build, and a finished act turned into an unbroken orange line across
the screen; the quiet ember recedes instead, which is what a walked road should do.

## Acceptance criteria

1. Marking a node done and reloading the page keeps it done. Marking it again and
   reloading keeps it undone. The key is `roadmap:progress:v1`.
2. Progress is not track-scoped: a node completed on one track shows complete on another
   track that also places it, without a second write.
3. `loadCompleted` never throws and never returns a non-string member — absent key,
   storage that throws on access, `"not json"`, `null`, `42`, `{"completed":"x"}` and
   `{"completed":[1,{},"ok"]}` all degrade to a usable set (empty, or `{"ok"}`).
4. An id in storage that is not in the registry is preserved by load/save rather than
   dropped, and is simply never displayed.
5. `computeTrackProgress` is pure and total: no act missing from `acts`, no `NaN`, and
   `0 ≤ completeT ≤ revealT ≤ 1` for every act, for any subset of completed ids including
   the empty set and the full set.
6. Fog of war is `stroke-dasharray` + `stroke-dashoffset` on a path carrying the act's own
   `d` string. No second `getTotalLength` call, no cloned DOM node, no per-act length
   measured twice.
7. Progress is drawn with **strokes**. No `box-shadow`, no `filter`, no `text-shadow`,
   nothing with a colour outside `theme.css`. Exactly one short segment of full-strength
   `--accent` exists on a track — the stretch between finished and standing — and none at
   all once the track is complete.
8. At zero progress `walked` is invisible (`dashoffset = L`), `reached` covers only the
   run up to the first node, and the base road renders exactly as spec 04 left it. At full
   progress both cover the whole path and the accent segment has closed to nothing.
9. Each dot carries its state: accent when complete, `--text-primary` for the one
   `current` node on the track, `--text-secondary` otherwise. Exactly one dot is `current`
   until the track is finished, at which point none is. Completing a node out of order
   changes only that dot, not the strokes.
10. The character stands at the first incomplete node of the first act that has one.
    Completing that node moves it to the next, and the move is a tween — `t` changes over
    several frames, so `useWalking` turns the bob on without any new flag.
11. When the frontier crosses into the next act, the character unmounts from the old act
    and walks in from `t = 0` of the new one. Exactly one `Character` is in the DOM
    throughout.
12. `useTweenedT` snaps on mount (no walk-in on first paint), cancels its frame on
    unmount, retargets rather than stacking when the target changes mid-tween, and returns
    the target immediately under `prefers-reduced-motion: reduce`. `StrictMode`'s
    double-invoked mount effect produces no walk.
13. The strokes' growth is a transition on `stroke-dashoffset` using `--ease-state`, and
    it goes away under `prefers-reduced-motion: reduce` — through the global rule
    `base.css` already carries, not a second copy here. No other motion is added.
14. The masthead shows `n / m DONE` for the current track, counting act nodes only, and it
    updates in the same render as the toggle that changed it.
15. `NodeCard`'s completion control keeps its class name, `aria-pressed` and its two
    labels. Its state now comes from the shared set, so two cards for the same node id
    (different tracks, or a re-render) can never disagree.
16. No hardcoded colour outside `theme.css`; no gradient, glassmorphism, glow shadow,
    emoji or default Tailwind palette token anywhere in the diff.
17. Edge cases render without crashing: an act with no placed nodes, a track with no acts,
    a single-node act, every node complete, and a 360px viewport where the cards have
    dropped to stacked flow.
18. A track's acts re-render only when their own slice changes. The walker's tween sets a
    new `t` every frame, and every act re-rendering on every one of those frames is a
    measurable frame-rate cost on a 7-act track.
19. `npm run build` and `npx tsc --noEmit` both exit 0.

## Notes for the implementer

- `PathNode`'s own comment already says "No completion state — spec 08 adds that", and
  `NodeCard`'s says its `useState` is "the exact surface spec 08 should replace". Take both
  literally; do not add a parallel component.
- The context exists because the fog, the walker and the cards must read one set. Lifting
  completion into `TrackMap` props instead would mean threading a setter through `ActPath`,
  which owns none of that state.
- `--accent-quiet` has been declared in `theme.css` since spec 02 and used nowhere. The
  walked stretch and the finished dots are what it was reserved for; do not introduce a
  tenth colour for either.
- Constant speed, not constant duration: a one-node hop is ~0.17–0.21 of `t` on the real
  geometry, so `TWEEN_MS_PER_T = 2400` puts a hop at ~410–510ms, near the stroke
  transition. The clamp keeps a whole-act jump from crawling.
