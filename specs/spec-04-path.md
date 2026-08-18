# Spec 04 — The path engine

**Depends on:** 01 (types, constants, registry), 02 (shell, theme, `Section`)

## Goal

Render each act of the learner's chosen track as one SVG `<path>` element with its
placed nodes as plain dots positioned by `path.getPointAtLength(total * t)`. This is
the load-bearing spec `CONTEXT.md` section 9 describes: one element, later reused by
four systems (placement, fog of war, character position, completed glow). Get the
position math right once, behind a hook, so nothing downstream reimplements it.

Ships deliberately bare: a hairline path, small dots, a text label per node. No cards,
no completion affordance, no character, no frontier styling. "Ugly is correct here" —
the aesthetic pass on this screen belongs to specs 05–09, each adding one layer on top
of the same path.

## In scope

- `src/path/pointAtT.ts` — pure function: given a mounted `SVGPathElement`, its
  measured total length, and a `t` in `[0, 1]`, returns `{ x, y, angle }`. Angle is
  `atan2` of the delta between the point at `t` and a point sampled `0.001` ahead,
  clamped so a `t` of `1` samples `0.001` behind instead (no divide against a point
  past the path's end).
- `src/path/PathContext.ts` — a `React.Context` carrying the current act's path ref
  and its measured total length, so multiple node components under the same `<path>`
  can each call a hook without threading props through every level.
- `src/hooks/usePathPoint.ts` — `usePathPoint(t): PathPoint | null`. Reads
  `PathContext`, returns `null` until the path is mounted and measured (first paint),
  a real point after.
- `src/components/ActPath.tsx` — renders one act's `<svg viewBox={act.viewBox}>`
  containing the one `<path d={act.path}>`, measures its total length on mount,
  provides `PathContext`, and renders one `PathNode` per entry in `act.nodes`.
- `src/components/PathNode.tsx` — one dot (`<circle>`) plus one mono text label at
  the node's title, positioned via `usePathPoint(placed.t)`. Renders nothing while
  the point is `null`.
- `src/components/TrackMap.tsx` — given a `Track`, renders one `Section` per act (in
  `track.acts` order) with an `ActPath` in its body. This is the screen the
  confirmation view in `App.tsx` becomes.
- `src/App.tsx` — the post-intake branch renders `TrackMap` instead of the spec 03
  placeholder confirmation. The `intake` branch, the "Change" masthead control, and
  the editing flow are unchanged.
- `src/styles/path.css` — new file: svg sizing, path stroke, dot fill, label type.
  Every value a token from `theme.css`.
- `src/index.css` — one new `@import`.

## Out of scope

- Cards in the negative-space pockets, level-collapse styling, the node panel, the
  character, fog of war / completed glow, frontier branches, act-to-act navigation,
  and the zoomed-out overview. Specs 05–10 own these, in that order, and every one of
  them is expected to reuse `usePathPoint`/`ActPath`'s `<path>` rather than add a
  second position calculation — `CONTEXT.md` section 9 is explicit that a second
  implementation is a bug, not a style choice.
- Branch paths (`track.branches`) — spec 09 (the frontier branch) renders these off
  their anchor node. This spec touches `track.acts` only.
- Animating anything. The character's tween (spec 07) and the fog dash-offset
  (spec 08) are the first things that change `t` over time; here `t` is static, read
  once from the data.

## Files

| File | Change |
| --- | --- |
| `src/path/pointAtT.ts` | New |
| `src/path/PathContext.ts` | New |
| `src/hooks/usePathPoint.ts` | New |
| `src/components/ActPath.tsx` | New |
| `src/components/PathNode.tsx` | New |
| `src/components/TrackMap.tsx` | New |
| `src/App.tsx` | Confirmation branch's body replaced |
| `src/styles/path.css` | New |
| `src/index.css` | One line added (`@import './styles/path.css';`) |

## Interfaces

```ts
// src/path/pointAtT.ts
export interface PathPoint {
  x: number
  y: number
  /** Degrees. Facing direction of travel at this point on the path. */
  angle: number
}

export function pointAtT(path: SVGPathElement, totalLength: number, t: number): PathPoint

// src/path/PathContext.ts
export interface PathContextValue {
  pathRef: React.RefObject<SVGPathElement | null>
  totalLength: number
}

export const PathContext: React.Context<PathContextValue | null>

// src/hooks/usePathPoint.ts
export function usePathPoint(t: number): PathPoint | null

// src/components/ActPath.tsx
export interface ActPathProps {
  act: Act
}
export function ActPath(props: ActPathProps): ReactNode

// src/components/PathNode.tsx
export interface PathNodeProps {
  placed: PlacedNode
}
export function PathNode(props: PathNodeProps): ReactNode

// src/components/TrackMap.tsx
export interface TrackMapProps {
  track: Track
}
export function TrackMap(props: TrackMapProps): ReactNode
```

`usePathPoint` returning `null` (rather than a stale or zeroed point) is deliberate —
`PathNode` must not render a `<circle>` at `(0, 0)` for one frame before the path is
measured. Callers gate on the `null` case; they never receive `NaN`.

## Acceptance criteria

1. `TrackMap` renders one `Section` per entry in `track.acts`, in array order, each
   containing exactly one `ActPath`.
2. Each `ActPath` renders exactly one `<svg viewBox={act.viewBox}>` and exactly one
   `<path d={act.path}>` inside it — the single load-bearing element, not duplicated.
3. Every id in `act.nodes` renders as one dot, positioned at
   `path.getPointAtLength(totalLength * placed.t)`, read through `usePathPoint` —
   never a separately computed `x`/`y`.
4. Before the path's total length is measured, `usePathPoint` returns `null` and
   `PathNode` renders nothing — no `<circle>` with `NaN` or `0` coordinates appears
   in the DOM at first paint.
5. `pointAtT` produces a finite, defined `angle` at `t = 0`, a mid-path `t`, and
   `t = 1` — the `t = 1` boundary samples backward instead of overflowing past the
   path's end.
6. Changing track (Change → pick a different track → submit) unmounts the previous
   track's acts and mounts the new one's — no dot or label from the old track
   remains in the DOM.
7. No card, completion control, character, or frontier-specific styling appears on
   this screen — dot and label only.
8. No hardcoded colour anywhere in `path.css` or the new components — every colour
   is a `var(--...)` from `theme.css`. `--accent` is not used for the dot, the line,
   or the label: spec 02 spent it on exactly three things (selection, focus ring,
   track-row hover) and this screen does not introduce a fourth use of it. `--accent`
   stays free for spec 08's completed-progress glow, which is the state that
   actually warrants it here.
9. 360px viewport: the `<svg>` scales to the container width (`width: 100%; height:
   auto` with the `viewBox` intact) — no horizontal overflow, and the act
   title/subtitle wrap the same way every other `Section` already does.
10. An act with zero entries in `act.nodes` (none exist in the current data, but the
    type allows it) renders the bare path and no dots — no crash.
11. `npm run build` and `npx tsc --noEmit` both exit 0.

## Notes for the implementer

- `ActPath` measures `pathRef.current.getTotalLength()` once, in a `useLayoutEffect`
  keyed on `act.path` — SVG `getTotalLength()` is in the path's own user-unit
  coordinate space, so it does not change when the container resizes (the `viewBox`
  handles scaling, not the measurement). Do not re-measure on window resize.
- `PathContext`'s value should be memoized on `totalLength` (the ref itself is
  stable) so `usePathPoint` doesn't recompute on every unrelated re-render.
- The dot radius and label offset are geometry, not colour or type — plain numbers
  in the SVG are fine and do not need a `theme.css` token. Only fill/stroke colour,
  font family, and font size need `var(--...)`.
- `PathNode`'s label reads `registry.getNode(placed.id).title` — do not duplicate
  title text in `tracks.json`.
