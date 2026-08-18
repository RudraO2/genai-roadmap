# Spec 07 — The character

**Depends on:** 04 (path engine: `pointAtT`, `PathContext`, `usePathPoint`, `ActPath`)

## Goal

Put a walker on the path. `<Character t={0.42} facing="right" variant={{ body, hair, outfit }} />`
renders a code-drawn geometric placeholder standing at position `t` on its act's path,
reading that position through `usePathPoint` — never computing one of its own. The props
are frozen by `prompts/00-antigravity-assets.md`: when the sprite sheets arrive, the swap
must be a rewrite of the inside of `Character.tsx` and nothing else. Do not block on
assets, and do not add any.

Motion is the second half of the contract. `CONTEXT.md` section 8 allows motion only to
show state change, so the two-state bob runs **only while `t` is changing** and the figure
stands still otherwise — which is also exactly what the sprite prompt asks for ("pause the
animation when `t` is not changing"). Nothing in this spec changes `t` over time; spec 08
is the first thing that does.

## In scope

- `src/types.ts` — two shared shapes: `Facing` (`'left' | 'right'`) and
  `CharacterVariant` (`{ body, hair, outfit }`, layer ids, strings). Types only, as the
  file already is.
- `src/path/pointAtT.ts` — one added pure function, `facingFromAngle(angle): Facing`.
  The path angle in degrees is already computed here; turning it into a facing is the
  same maths, not a second implementation.
- `src/path/viewBox.ts` — one added pure function, `pointToPercent(point, size)`,
  converting an SVG-space point into `{ leftPct, topPct }` of the act's viewBox. This is
  the conversion `NodeCard` currently inlines; both callers use the one copy, and it
  returns `0` rather than `Infinity` for a zero-sized viewBox.
- `src/components/NodeCard.tsx` — uses `pointToPercent` in place of its two inline
  divisions. No behaviour change.
- `src/hooks/useWalking.ts` — `useWalking(t): boolean`. `true` from the moment `t`
  changes until it has been still for `WALK_SETTLE_MS`. `false` on mount.
- `src/components/Character.tsx` — the component. Reads `usePathPoint(t)`, renders
  nothing until the path is measured, positions itself by percentage of the act's
  viewBox with its feet on the path point, mirrors with `scaleX(-1)` when facing left,
  and stacks three layer elements in the sprite prompt's order (`body` → `outfit` →
  `hair`) so a future sheet swap is a change of layer styling only.
- `src/components/ActPath.tsx` — optional `characterT` prop, and an `.act-stage__path`
  wrapper around the `<svg>`. When `characterT` is a number the act renders one
  `Character` in an overlay inside that wrapper — not the card overlay, which collapses
  to static flow below 640px and makes `.act-stage` taller than the path itself.
- `src/components/TrackMap.tsx` — optional `character?: { actId, t }` prop deciding which
  act hosts the walker and where. Defaults to the first act at `t = 0`. Spec 08 replaces
  the default with the learner's progress frontier by passing the prop.
- `src/styles/character.css` — new file: the placeholder's geometry, the layer colours,
  and the `character-step` keyframes. Every colour a `theme.css` token.
- `src/index.css` — one new `@import`.

## Out of scope

- **Sprite sheets, or any image asset.** The placeholder is the deliverable;
  `prompts/00-antigravity-assets.md` runs last, by a human, against a working map.
- **Making `t` change.** No tween, no progress, no localStorage. Spec 08 owns the tween
  toward the progress frontier and is the first caller to pass a moving `t`.
- **Variant-specific artwork.** `variant` is carried, validated by the type, and written
  to `data-*` attributes so the sprite swap has something to key on. The placeholder
  draws the same geometry for every variant — inventing five skin tones would mean five
  colours that are not in `theme.css`, which section 8 forbids outright.
- **A variant picker.** Nothing in the UI chooses a variant yet; the component's default
  is used. Whether the learner ever picks one is a later product question, logged to
  `BACKLOG.md`, not decided here.
- Fog of war, completed glow, frontier branches, act navigation. Specs 08–10.

## Files

| File | Change |
| --- | --- |
| `src/types.ts` | `Facing` and `CharacterVariant` added |
| `src/path/pointAtT.ts` | `facingFromAngle` added |
| `src/path/viewBox.ts` | `pointToPercent` added |
| `src/components/NodeCard.tsx` | Two inline divisions replaced by `pointToPercent` |
| `src/hooks/useWalking.ts` | New |
| `src/components/Character.tsx` | New |
| `src/components/ActPath.tsx` | `characterT` prop, `.act-stage__path` wrapper, character overlay |
| `src/components/TrackMap.tsx` | `character` prop, default placement |
| `src/styles/character.css` | New |
| `src/index.css` | One line added |

## Interfaces

```ts
// src/types.ts
export type Facing = 'left' | 'right'

/** Sprite layer ids, in the compositing order prompts/00-antigravity-assets.md fixes. */
export interface CharacterVariant {
  body: string
  hair: string
  outfit: string
}

// src/path/pointAtT.ts
export function facingFromAngle(angle: number): Facing

// src/path/viewBox.ts
export interface PercentPosition {
  leftPct: number
  topPct: number
}
export function pointToPercent(
  point: { x: number; y: number },
  size: ViewBoxSize,
): PercentPosition

// src/hooks/useWalking.ts
export const WALK_SETTLE_MS: number
export function useWalking(t: number): boolean

// src/components/Character.tsx
export const DEFAULT_VARIANT: CharacterVariant

export interface CharacterProps {
  /** 0-1 along the enclosing act's path. The only position input. */
  t: number
  /** Omit to derive facing from the path's direction of travel at `t`. */
  facing?: Facing
  variant?: CharacterVariant
  viewBoxWidth: number
  viewBoxHeight: number
}
export function Character(props: CharacterProps): ReactNode

// src/components/ActPath.tsx
export interface ActPathProps {
  act: Act
  level: Level
  /** `t` of the walker, when this act is the one hosting it. */
  characterT?: number | null
}

// src/components/TrackMap.tsx
export interface CharacterPlacement {
  actId: string
  t: number
}
export interface TrackMapProps {
  track: Track
  level: Level
  character?: CharacterPlacement
}
```

`t`, `facing` and `variant` are the three props `prompts/00-antigravity-assets.md` freezes,
with the same meanings. `facing` is optional here, defaulting to the direction of travel
the path engine already computes — a caller that passes `facing="right"` explicitly, as
the prompt's example does, still gets exactly that. `viewBoxWidth`/`viewBoxHeight` are
positioning plumbing supplied by `ActPath`, the same two `NodeCard` already takes; they
are not part of the frozen visual contract and do not change under sprites.

## Acceptance criteria

1. `Character` derives its position from `usePathPoint(t)` only. There is no second
   `getPointAtLength`, no stored `x`/`y` prop, and no geometry maths outside
   `pointAtT.ts` / `viewBox.ts`.
2. Before the act's path is measured, `usePathPoint` returns `null` and `Character`
   renders nothing — no element at `(0, 0)` or with a `NaN` offset at first paint.
3. The figure's feet sit on the path point: the character box is anchored bottom-centre
   at that point, not centred on it.
4. With no `facing` prop, facing comes from `facingFromAngle(point.angle)` — right while
   the path travels rightward, left while it travels leftward. Passing `facing`
   explicitly overrides the derived value. Facing left is a `scaleX(-1)` mirror of the
   right-facing figure; there is no separately drawn left-facing artwork.
5. `facingFromAngle` is total and pure: every finite degree value in `[-180, 180]`
   returns `'left'` or `'right'`, with `±90` (straight up/down) resolving to `'right'`
   rather than `undefined`.
6. Exactly one `Character` exists in the DOM for the whole track — one act hosts it,
   every other act renders none.
7. The bob animation runs only while walking. On a static `t` the figure has no running
   animation (`data-walking="false"`, `animation: none`), which is the state the app
   ships in this spec, since nothing changes `t` yet.
8. `useWalking` returns `false` on mount, `true` on the commit following a `t` change,
   and `false` again `WALK_SETTLE_MS` after the last change. Its timer is cleared on
   unmount and restarted (not stacked) by a change arriving mid-settle. `StrictMode`'s
   double-invoked mount effect starts no timer and no walk.
9. `prefers-reduced-motion: reduce` disables the bob entirely, in CSS, regardless of
   walking state.
10. The three layer elements render in the order `body`, `outfit`, `hair`, each carrying
    its variant id in a `data-*` attribute, and share one `animation-name` so they can
    never drift out of sync once they become sprite sheets.
11. The character overlay is `aria-hidden` and `pointer-events: none`: it never
    intercepts a click meant for a card, and it announces nothing to a screen reader
    (it duplicates no information).
12. No hardcoded colour in `character.css` or `Character.tsx` — tokens only, and not
    `--accent`, which stays reserved for spec 08's completed-progress state.
13. Every layer's size, the bob distance, and the settle time are geometry/timing, not
    colour or type — plain values are fine, but the bob's duration and easing read
    `--dur-state`/`--ease-state` where they apply.
14. 360px viewport: the character stays on the path (it is positioned against the same
    `viewBox` percentages the `<svg>` scales by) and adds no horizontal overflow, even
    though the card overlay has dropped to stacked flow at that width — the character's
    containing block is the `<svg>`'s own wrapper, never `.act-stage`, whose height
    grows with those stacked cards.
15. A track whose host act has zero placed nodes still renders the character on its bare
    path; a track with zero acts renders no character and does not crash.
16. `npm run build` and `npx tsc --noEmit` both exit 0.

## Notes for the implementer

- The character overlay must be its **own** absolutely-positioned `<div>`, inside a
  wrapper holding only the `<svg>`. Two separate reasons, both found by measurement:
  below 640px `.act-stage__cards` becomes `position: static; display: flex`, so a
  character inside it stacks as a flex item; and the stacked cards then make
  `.act-stage` several times taller than the path, so an overlay inset to the stage puts
  the walker's feet below the bottom of the `<svg>` (measured at 104.6% of the path's
  height before the wrapper existed).
- Keep the bob keyframes on the **layers**, not on the positioning wrapper. The wrapper
  owns `translate(-50%, -100%) scaleX(±1)`; an animation on the same element would
  fight it. One shared `animation-name` across layers is what keeps future sprite sheets
  frame-locked to each other.
- `useWalking` compares against a `useRef` of the previous `t` and returns early when
  they match, so the mount pass never schedules a timer and a re-render for an unrelated
  reason never starts a walk.
- Do not add a `Character` to `PathNode` or to the `<svg>`. HTML is deliberate: the
  sprite version is layered `background-image` divs with `background-size: 400% 100%`,
  and putting the placeholder in SVG now would make that a rewrite of the positioning
  rather than of the drawing.
