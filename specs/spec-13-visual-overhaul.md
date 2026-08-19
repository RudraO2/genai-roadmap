# Spec 13 — Visual overhaul: the paper roadmap

**Depends on:** 01–12 (every screen exists; this spec restyles all of them)

**Opened:** 2026-08-19, by the project owner, alongside the owner-authorised amendment to
`CONTEXT.md` section 8.

## Why this spec exists

Two things happened before it was written.

1. The owner decided the identity was wrong. *Editorial dark terminal* is a good look for
   a technical journal and a poor look for a map you walk along. Section 8 was amended to
   **paper roadmap** — warm paper, ink road, four semantic paper accents, one action
   accent, a heavy rounded display face.
2. A previous non-Ralph session (Codex) attempted the change without amending section 8
   and shipped it half-done. That work is the starting tree for this spec, and most of it
   has to be corrected rather than kept:
   - `shell.css` injected `content: 'LANE'` into `.shell__wordmark::before` — a brand
     lifted from the reference site the owner supplied. It is not this project's name.
   - The palette flipped to paper but the type stack did not: Instrument Serif titles over
     candy-coloured sticky notes. This is the mismatch the owner reported.
   - Card paper was assigned by `nth-child(4n + …)`. Colour with no meaning, now banned by
     name in section 8.
   - Cards are centred on their path point, so every card sits **on** the road it is
     supposed to sit beside.
   - The pocket layout stays on down to 640px, but the pockets stop fitting a card at
     about 900px, so 640–900px renders cards overlapping each other and the road.

## Goal

Every screen reads as one designed artefact under the amended section 8, at every
breakpoint, with colour that carries information.

## In scope

**Type.** Vendor Gabarito (400–900) and Space Grotesk (300–700) as woff2 beside the
existing JetBrains Mono. Retire Instrument Serif. Three faces, three jobs, per section 8:
Gabarito display, Space Grotesk body/UI, JetBrains Mono for labels and counters only.

**Palette.** Rewrite `theme.css`: paper base, ink, four named papers, one action accent,
plus the ink-shadow and radius tokens the paper surfaces need. Every value a token.

**Semantic colour.** A card's paper comes from its data, in this precedence:

| Condition | Paper |
| --- | --- |
| dormant (derived from `last_commit`) | grey paper, muted ink |
| first link `kind: repo` | lime |
| first link `kind: docs` | blue |
| first link `kind: playground` | lilac |
| first link `kind: article` / `thread` / `video` | amber |
| `zone: frontier` | *no paper change* — a dashed ink border |

Level was the first axis tried and measured wrong: the acts ramp, so an act's
nodes nearly all share a level and every screen came out one flat colour (act 1 of
`game` is five beginners). Kind varies inside an act and says something the map's
shape cannot. Level is still printed on the card and still drives collapsing.

**Portrait curves.** `data/tracks.json` geometry is rewritten, because measurement said
the pocket bug is geometric and not cosmetic. The landscape `1200x760` box put its runs
230 units apart, and a card is 211–256 units tall at every width where pockets are used —
so no placement rule could ever have kept a card off the road. The three curves become
portrait serpentines with runs 420 units apart (`long` 1400×1600, `medium` 1400×1180,
`short` 1400×760), which also makes each act read as a road you scroll down rather than a
diagram you scan across. Node `t` and `side` are untouched — `t` is a fraction, so every
node lands on the same relative point of its curve.

**Pockets that work.** A card anchors to the *normal* of the path at its `t` — sampled
from the same `usePathPoint` machinery section 9 already mandates — and aligns the edge
nearest the road to that anchor. Four pockets (above / below / left / right) derived from
the normal's direction, sign chosen by the `side` field already in `tracks.json`. No card
covers the road at any width where pockets are used.

**Stop numbers.** Each placed node gets its 1-based index within its act, drawn in the dot
on the road and repeated on the card. This is the wayfinding that makes the stacked
breakpoint legible, and it is the thing the reference site does with its hour markers.

**Every breakpoint designed.** Pockets above 78rem. That number is measured, not chosen: a
card never shrinks below 224px, so the narrower the stage the *larger* the card is in viewBox
units, and two cards stop fitting in one 420-unit band once the stage is under about 1157px.
Below the line, the act renders as a road strip plus a numbered stop list, numbers matching
the road.

**Road drawing.** The road reads as a road: ink casing at full width, a dashed centre
line, action-accent fill on the walked stretch, and the frontier spur drawn in the same
road language at a narrower gauge rather than as a hairline.

**Every existing screen.** Intake, act path, node card, node panel, act navigation,
overview map, frontier spur, progress/portability panel, shell.

## Out of scope

- Any change to `data/nodes.json` — no new nodes, no new URLs, no re-verification.
- Any node's `t` or `side` placement. Every node stays on the same relative point of its
  curve; only the curve's proportions changed.
- New npm dependencies. The two new faces are vendored woff2 files, not packages.
- The walk-cycle sprite that arrived in `public/assets/`. Section 9 always said sprites
  would land behind the frozen `<Character t facing variant />` interface, and it does.
  Keep it; restyle around it.
- New features. Nothing gains behaviour it did not have after spec 12.

## Files

- `CONTEXT.md` — section 8 amended (owner-authorised; the one permitted edit).
- `specs/spec-13-visual-overhaul.md` — this file.
- `src/fonts/gabarito-400-900-latin{,-ext}.woff2` — new, vendored.
- `src/fonts/space-grotesk-300-700-latin{,-ext}.woff2` — new, vendored.
- `src/fonts/instrument-serif-*.woff2` — deleted.
- `src/theme.css` — rewritten: faces, palette, sizes, paper tokens.
- `src/styles/base.css` — body face and paper ground.
- `src/styles/shell.css` — `LANE` removed, masthead/section/track-index restyled.
- `src/styles/intake.css` — track and level pickers as paper rows.
- `src/styles/path.css` — road casing, centre line, dots with stop numbers, act sign.
- `src/styles/cards.css` — pocket anchoring, semantic paper, stacked stop list.
- `src/styles/branch.css`, `navigation.css`, `panel.css`, `portability.css` — restyled.
- `src/styles/character.css` — sized against the new road gauge.
- `data/tracks.json` — the three curves and every act's `path`/`viewBox`, portrait.
- `src/path/pockets.ts` — new. The placement solver: normal-derived candidates, bounds and
  collision tests against the road and against already-placed cards.
- `src/components/NodeCard.tsx` — pocket + stop number + semantic paper class.
- `src/components/PathNode.tsx` — stop number in the dot.
- `src/components/ActPath.tsx` — act sign markup corrected, stop indices threaded.
- `src/components/Shell.tsx` — wordmark markup owns its own mark, not a CSS `content`.

## Acceptance criteria

1. `npm run build` and `npx tsc --noEmit` both exit 0.
2. No occurrence of `LANE`, or of any brand not this project's, anywhere in `src/` or `dist/`.
3. No `nth-child` colour assignment anywhere in `src/styles/`.
4. Instrument Serif is absent from the tree and from `dist/`.
5. No hardcoded colour outside `theme.css` (the existing `check:theme` gate proves it).
6. At 1440px and 1280px, across every one of the six curve/node-count combinations in
   the registry: no card's rendered box intersects the road's rendered stroke, and no two
   cards overlap. Measured in the live DOM by sampling the path, not by comparing bounding
   boxes — a serpentine's bounding box covers its whole act.
7. At 1024px, 760px and 390px: the stacked list is in force, there is no horizontal
   document overflow, and no card is clipped by the viewport.
8. Every card's paper colour is derivable from its node's first link kind and its
   dormancy by the table above — verified by reading computed styles against the
   registry — and the same fact is printed on the card in words.
9. At pocket widths, every stop on a road carries its number and the number on its card
   matches. Below them the number is dropped from the road only — it would render at
   under four pixels — and the cards keep it, in road order.
10. The three faces are each used only for their section 8 job.
