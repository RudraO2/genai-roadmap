# Spec 05 — Node cards in the negative-space pockets

**Depends on:** 01 (types/registry), 04 (path engine — `usePathPoint`, `ActPath`, `PathContext`)

## Goal

Give every placed node a card that sits beside its dot, in the empty space the S-curve
bends leave open, alternating left/right per the `side` field already stored on
`PlacedNode`. The card is the first real information surface in the app: title, blurb,
and level, plus an inert completion affordance that spec 08 will wire to localStorage.
This spec also owns level filtering — a node whose level ranks below the learner's chosen
level renders as a hairline stub instead of a full card, expandable on click.

## In scope

- `NodeCard`: renders a full card (level tag, title, blurb, completion toggle) or, when
  the node's level ranks below the learner's chosen level, a collapsed hairline stub with
  just the title as an expand control.
- Positioning the card from the same `t`/`side` data the dot already uses — via
  `usePathPoint`, never a second coordinate source.
- A narrow-viewport fallback where cards stack in normal document flow below their act's
  path instead of floating in absolute pockets (there is no negative space to sit in once
  the map no longer has room to breathe).
- Threading the learner's chosen `Level` from `App` down through `TrackMap` → `ActPath` →
  `NodeCard`.

## Out of scope

- Persisting completion state (spec 08). The toggle here is local component state only —
  it resets on remount. Spec 08 replaces it with a localStorage-backed version behind the
  same visual affordance.
- The node detail panel / grouped links (spec 06). The card shows a blurb, not the link list.
- Fog of war, the character, frontier branches (specs 07–09).
- Branch/frontier node cards — `ActPath` today only renders `act.nodes`, never
  `branches`; this spec does not change that.

## Files

- `specs/spec-05-cards.md` — this file
- `src/path/viewBox.ts` — new. Pure `parseViewBoxSize(viewBox: string): { width, height }`.
- `src/components/NodeCard.tsx` — new. The card/stub component.
- `src/components/ActPath.tsx` — edited. Adds a `level` prop, wraps the existing `<svg>`
  in a `.act-stage` container, adds a sibling overlay rendering one `NodeCard` per placed
  node, reusing the same `PathContext.Provider`.
- `src/components/TrackMap.tsx` — edited. Adds a `level` prop, passes it to `ActPath`.
- `src/App.tsx` — edited. Passes `intake.level` to `TrackMap`.
- `src/styles/cards.css` — new. `.act-stage`, `.node-card` and its modifiers, the
  narrow-viewport stacked fallback.
- `src/index.css` — edited. Imports `cards.css`.

## Interfaces

```ts
// src/path/viewBox.ts
export interface ViewBoxSize { width: number; height: number }
export function parseViewBoxSize(viewBox: string): ViewBoxSize

// src/components/NodeCard.tsx
export interface NodeCardProps {
  placed: PlacedNode
  viewBoxWidth: number
  viewBoxHeight: number
  learnerLevel: Level
}
export function NodeCard(props: NodeCardProps): ReactNode

// src/components/ActPath.tsx
export interface ActPathProps { act: Act; level: Level }

// src/components/TrackMap.tsx
export interface TrackMapProps { track: Track; level: Level }
```

`NodeCard` positions itself: it calls `usePathPoint(placed.t)` directly (same hook
`PathNode` uses), converts the returned SVG-space point to a percentage of the act's
viewBox using `viewBoxWidth`/`viewBoxHeight`, and renders `null` until the point is
non-null — identical gating to `PathNode`. It never receives `x`/`y` as props.

## Acceptance criteria

- [ ] Every placed node on every act renders exactly one `NodeCard` (full or stub),
  matching `act.nodes.length`.
- [ ] A node whose `level` ranks below the learner's chosen level (`LEVEL_RANK`) renders
  as a stub by default; clicking it reveals the full card without a page reload; a
  "Collapse" control on the expanded card returns it to a stub.
- [ ] A node whose `level` ranks at or above the learner's level renders as a full card
  immediately, no stub state.
- [ ] Card side (`left`/`right`) matches `placed.side` for every node.
- [ ] The completion control toggles a pressed (`aria-pressed`) visual state on click and
  is keyboard-operable (`Tab` + `Enter`/`Space`); it does not write to `localStorage`.
- [ ] Switching track via "Change track / level" unmounts the old track's cards and
  mounts the new track's — no stale card from the previous track remains in the DOM.
- [ ] Changing level via "Change track / level" (same track) changes which nodes render
  as stubs vs. full cards.
- [ ] At a 360px-wide viewport, cards stack below their act's path in document order with
  zero horizontal overflow (`document.documentElement.scrollWidth <=
  window.innerWidth`).
- [ ] No hardcoded colour, gradient, glow, or emoji anywhere in the new/edited files —
  every colour is a `var(--...)` from `theme.css`.
- [ ] `npm run build` and `npx tsc --noEmit` both exit 0.
