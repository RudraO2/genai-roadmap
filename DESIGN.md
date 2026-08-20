# DESIGN.md — the visual language

This is the whole of the design constitution. It replaces `CONTEXT.md`, which
described an earlier version of this project — a single serpentine SVG road with a
walking character, a `nodes.json` / `tracks.json` registry, and card colours keyed
to link kind. None of those exist. Keeping a document that describes them was a
standing invitation to rebuild them by accident, so it is gone; git history has it
if anyone ever wants it.

Everything below describes the app as it is.

## The aesthetic

A **printed road atlas**: a risograph field guide, an activity poster you could pin
to a wall. Warm paper, ink-black rules, a small set of flat spot colours that each
*mean* something. Playful, but not a toy — every colour is load-bearing.

**The test.** Would this look at home as a printed atlas or a wall poster for a
course? If it looks like a Product Hunt launch, it is wrong. If it looks like a dark
developer terminal, that is the identity this project had before 2026-08-19 and is
also wrong — do not restore it.

## Banned outright

- Gradients, anywhere, for anything. Flat spot colour only.
- Glassmorphism, `backdrop-blur`, frosted panels.
- Emoji as UI icons.
- Default Tailwind palette tokens (`slate-900`, `indigo-500`, `violet-*`).
- Glow shadows, neon halos, `box-shadow` with colour. A hard *offset* ink block
  behind a paper surface is not a glow and is allowed — spelled
  `drop-shadow(x y 0 ink)` with a zero blur radius, because the build gate rejects
  `box-shadow` outright.
- Bento grids.
- Inter, as a typeface, anywhere.
- Uniform `rounded-2xl` on every surface.
- Centred hero plus gradient headline plus two pill buttons.
- Ambient motion: float, parallax, pulse, spin, anything that runs on a loop.
- **Colour as decoration.** A surface's colour is derived from its data. Cycling
  `nth-child` through a palette is banned by name.

`npm run check:theme` enforces most of this against the source, and
`npm run check:output` checks the built CSS in case a banned utility survived.

## Type: three faces, three jobs

| Face | Weight | Job |
| --- | --- | --- |
| **Gabarito** | 700–900 | Display. Headings, card titles, the path name. Heavy, rounded, geometric, tight tracking. |
| **Space Grotesk** | 400–700 | Body and UI. Blurbs, standfirsts, prose, hints. |
| **JetBrains Mono** | 500–700 | The instrument panel, and nothing else. Labels, counters, tags, tallies, state words, metadata. |

No serif. Seven sizes, declared in `theme.css` as `--size-*`, and every
`font-size`, `letter-spacing` and `line-height` in `src/styles/` must be one of
those tokens verbatim — the theme gate rejects a literal or a `calc()` on those
properties, which is what keeps a scale a scale.

The scale tops out at `--size-title`. There is deliberately no display step above
it: the one screen that spent one was onboarding, where two hero headings were most
of the reason the button people needed sat below the fold.

## Colour: two channels that never mix

Warm paper ground (`#FFFCEB`), near-black ink (`#17191B`) for every rule, border and
sign. On top of that, colour answers exactly two questions, and each question has
its own surfaces.

**On a quest box — what kind of work is this?** Assigned from the node's `type`,
the same on every path:

| Paper | Type | Meaning |
| --- | --- | --- |
| white | `core` | the spine of a stage |
| blue | `side` | an optional detour (also drawn with a dashed border) |
| lime | `build` | you make something |
| amber | `boss` | a stage capstone |
| grey | — | the locked/quiet surface |

**On the chrome around it — which path am I on?** Assigned from the path's `id`:
`--path-explorer`, `--path-engineer`, `--path-builder`, `--path-creator`, each with
a pale `-wash` for large surfaces. It lands on the map's ground, the sticky path
bar, the current stage's rules, the stage stepper's "here" chip and the quest
dialog's spine. It never lands on a quest box, because a box already means
something.

**One action accent** (green). It means *done*, *here* or *go*, and nothing else.
It is never a decorative background, and it stays green on all four paths — that is
the point of it being the only one.

Colour is never the only channel. Every state that has a colour also has a word:
`Ready`, `Locked`, `Done`, `Last opened`, `You are here`, `cleared`, `review`,
`stretch`.

## Structure, space, motion

- **Rules**, not hairlines: 2px ink borders by default, 3px where something is
  emphasised. Hard edges. A small radius and a degree or two of rotation are
  allowed only on things meant to read as paper stuck to a page.
- **Space:** dense inside the map, generous around it. The map earns the density;
  nothing else does.
- **Motion only to show a state change**, and only on the transition itself. The
  reward tokens (`--dur-reward`, `--ease-reward`) exist for the one-shot moments
  that mark a learner actually finishing something, and every use must be gated on
  a real transition — a hook watching a boolean, or an element that does not exist
  until the condition is first true. A map loading with forty quests already done
  must not put on a fireworks display.
- **Every breakpoint is a designed screen.** The absolute-positioned map is a
  desktop artefact; below `64rem` the same data is a stage list, which is a better
  phone experience and a better screen-reader experience, not a degradation. A card
  clipped off-screen, overlapping another card, or laid across a rule is a bug.
- **Touch targets are at least 44px** on any surface a phone can reach. The theme
  carries `--touch-min` for it, applied under `@media (pointer: coarse)` so a mouse
  keeps the tighter instrument-panel sizing.

  The blanket rule in `base.css` sets `min-height` only. **A control drawn as a
  square needs both dimensions naming in the coarse-pointer block at the foot of
  `graph.css`**, or it stretches into an oval — `min-height` clamps a height
  whatever the cascade layer says. Two controls are listed there, and one, the
  map's corner tick, is exempt by name and by comment because it sits on a fixed
  grid that has no room to grow. A new square control belongs in one list or the
  other.

## Where the rules live in code

| File | What it owns |
| --- | --- |
| `src/theme.css` | Every colour and type value in the project, as a custom property. The only file allowed to hold a literal. |
| `src/index.css` | Import order, and the `@theme` block that deletes the Tailwind namespaces a banned utility would need to exist at all. |
| `src/styles/*.css` | Component styling, tokens only, one file per surface. |
| `scripts/check-theme.ts` | The gate. Rejects a literal colour or type value outside `theme.css`, a banned property, and an unknown token. |
| `public/icon.svg` | The one file outside `theme.css` that holds a colour, stated as an exception rather than discovered as one. An app icon is an asset, like the font files, and cannot read a stylesheet. It carries the ground and the ink, and it changes when they do. `public/apple-touch-icon.png` is a 180px raster of it. |
| `og-card.html` | The source of the share card, `public/og.png`. A real page rather than a hand-drawn image, so the card is set in the project's own faces at the project's own sizes out of the project's own tokens — it holds no literal of its own. Vite builds `index.html` only, so it never reaches `dist/`. Regenerate after a theme change: `npm run dev`, open `/og-card.html`, screenshot the 1200x630 `.card` element over `public/og.png`. |

Tailwind is for layout only — spacing, flex, grid, breakpoints, position. Colour and
type reach components through `var(--…)`, never through a class.
