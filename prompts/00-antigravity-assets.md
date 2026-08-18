# Prompt 00 — Antigravity sprite sheets

**Run this LAST, not first.** The app ships with a code-drawn placeholder character.
Generate sprites only once the map renders and walks correctly — otherwise you'll be
regenerating assets against a moving target.

---

## The layering decision (read before generating anything)

Do **not** generate one sheet per character variant. 5 skin tones × 6 hairstyles ×
8 outfits baked together is 240 sheets. Generate **layers** instead — 19 sheets total,
composited at runtime as stacked absolutely-positioned elements sharing one
`steps()` animation.

Layers: `body` → `outfit` → `hair` → `accessory`

For layers to register against each other, every sheet must share: identical canvas
dimensions, identical frame count, identical frame order, and an identical baseline
(the y-pixel where feet touch ground). State these constraints in every prompt.

## Fixed specification for all sheets

```
Canvas:        4 frames, horizontal strip, 64×64 px per frame = 256×64 total
Background:    fully transparent
View:          side profile, facing right
Baseline:      feet at y=60 in every frame, never varies
Bounding box:  character occupies y=8..60, centered horizontally in each cell
Style:         pixel art, limited palette, hard edges, no anti-aliasing,
               no outline glow, no gradients
Palette:       max 6 colors per layer
```

Facing left is handled in CSS with `transform: scaleX(-1)`. Never generate a
left-facing sheet.

## Prompt template — body layer

> Pixel art sprite sheet, 4-frame walk cycle, horizontal strip, each frame exactly
> 64×64 pixels, total image 256×64 pixels. Transparent background. Side profile view
> facing right. A simple humanoid figure, [SKIN TONE] skin, plain neutral undergarments
> only — no hair, no clothing, no accessories. Feet must touch the exact same baseline
> in all four frames. Character centered in each frame. Hard-edged pixel art, no
> anti-aliasing, no outlines, no glow, no gradients, maximum 6 colors. Frames in
> order: contact, passing, contact opposite, passing opposite.

## Prompt template — hair layer

> Pixel art sprite sheet, 4-frame walk cycle, horizontal strip, each frame exactly
> 64×64 pixels, total 256×64 pixels. Fully transparent background. ONLY a [STYLE]
> hairstyle in [COLOR] — no head, no face, no body, no neck. The hair must be
> positioned as if worn on a head whose crown sits at y=10 and whose chin sits at
> y=26, centered horizontally. Slight bob motion across frames matching a walk cycle.
> Hard-edged pixel art, no anti-aliasing, maximum 4 colors.

## Prompt template — outfit layer

> Pixel art sprite sheet, 4-frame walk cycle, horizontal strip, each frame exactly
> 64×64 pixels, total 256×64 pixels. Fully transparent background. ONLY clothing —
> a [GARMENT] in [COLOR] — with no body, head, or limbs visible. Positioned to fit a
> humanoid figure occupying y=8 to y=60. Fabric shifts naturally across the four walk
> frames. Hard-edged pixel art, no anti-aliasing, maximum 5 colors.

## The failure mode to watch for

AI-generated walk cycles drift: the character subtly changes size or shifts off-center
between frames, which reads as a wobble once animated. **Four frames is far safer than
eight** — fewer chances to drift, and a 4-frame cycle at 150ms reads perfectly fine.

After generating, check every sheet by flipping between frames at full size. If the
silhouette jumps, regenerate rather than trying to fix in-place. Budget real time for
this step; it is the single most likely thing to eat a weekend.

## Handing sprites to Claude Code

The placeholder must already implement this interface, so sprites are a swap and not
a refactor:

```tsx
<Character t={0.42} facing="right" variant={{ body, hair, outfit }} />
```

Task for Claude Code once sheets exist:

> Replace the code-drawn placeholder inside `Character.tsx` with layered sprite
> rendering. Keep the component's props identical. Each layer is a div with
> `background-image` pointing at its sheet, `background-size: 400% 100%`, animated
> with `steps(4)` over 600ms, all layers sharing one `animation-name` so they stay in
> sync. Pause the animation when `t` is not changing. Do not alter the path-following
> math — only the visual layer changes.
