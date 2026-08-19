/**
 * The pocket solver. Pure geometry, no React, no DOM — it takes points already
 * sampled off the act's one `<path>` and decides where each card sits.
 *
 * CONTEXT.md section 9: "Cards sit in the negative-space pockets created by the
 * S-curve bends, alternating sides." Section 8, as amended by spec 13, makes the
 * stronger promise: a card never covers the road. That cannot be done by a rule of
 * the form "offset by `side`" alone, because a serpentine's bands are shared — the
 * space below run 1 is the same space as above run 2 — and the road loops back
 * through the band it just left.
 *
 * So placement is a search, not a formula:
 *
 *   1. Candidates. Four pockets — the normal of the path at `t` rotated to the
 *      side the data asks for, its opposite, then the two perpendicular
 *      directions, inward first. Each is tried at nine offsets sliding along its
 *      own long axis, and each candidate box is clamped into the viewBox rather
 *      than discarded for leaving it.
 *   2. Score. Road samples inside the box, plus area shared with a card already
 *      placed, plus how far the clamp had to move the box. Zero means clean.
 *   3. The first zero-scoring candidate wins; if none scores zero, the *lowest*
 *      score does. That is the part that matters. An earlier version took the
 *      first candidate as a fallback, which put a card flat across the road
 *      whenever an act was crowded — worse than any of the candidates it had
 *      already rejected. A card is never dropped, and never plants itself on the
 *      road when a merely tight spot exists.
 *
 * Placement is a pure function of the geometry and the node order, so it is
 * stable: the same act at the same width always produces the same layout.
 */

import type { PathPoint } from './pointAtT.ts'

export type Pocket = 'above' | 'below' | 'left' | 'right'

export interface PocketInput {
  /** Sampled from the act's path, in viewBox units. */
  point: PathPoint
  /** Which side of the road the registry asked for. */
  side: 'left' | 'right'
}

export interface PocketBox {
  /** viewBox units, top-left corner. */
  x: number
  y: number
  w: number
  h: number
}

export interface PocketPlacement {
  pocket: Pocket
  /** Anchor as a percentage of the viewBox, for the HTML overlay. */
  leftPct: number
  topPct: number
  /** The box the solver reserved, in viewBox units. Exposed for measurement. */
  box: PocketBox
  /** 0 when the card is clear of the road and of every other card. */
  score: number
}

export interface PocketOptions {
  viewWidth: number
  viewHeight: number
  /** Card size in viewBox units. Uniform across an act. */
  cardWidth: number
  cardHeight: number
  /** Clearance between the road's centre line and the card's near edge. */
  gap: number
  /** Road half-width, so the collision test knows how fat the ink is. */
  roadHalf: number
  /** The road, sampled along its length in viewBox units. */
  road: ReadonlyArray<{ x: number; y: number }>
}

/**
 * Slide fractions of the card's long axis, tried in this order — nearest to the
 * dot first, so a card only wanders when it has to.
 */
const SLIDES = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4]

/** Keep cards from touching: a card's own border is 2px, and paper wants air. */
const CARD_PADDING = 12

/**
 * Cards are tilted a degree or so in CSS (`cards.css`), which grows the box they
 * actually occupy by roughly `w * sin(1deg)` on each axis. The solver works in
 * axis-aligned boxes, so it pads for the rotation rather than modelling it.
 */
const ROTATION_ALLOWANCE = 8

function boxFor(pocket: Pocket, point: PathPoint, slide: number, o: PocketOptions): PocketBox {
  const { cardWidth: w, cardHeight: h, gap } = o
  switch (pocket) {
    case 'above':
      return { x: point.x - w / 2 + slide * w, y: point.y - gap - h, w, h }
    case 'below':
      return { x: point.x - w / 2 + slide * w, y: point.y + gap, w, h }
    case 'left':
      return { x: point.x - gap - w, y: point.y - h / 2 + slide * h, w, h }
    case 'right':
      return { x: point.x + gap, y: point.y - h / 2 + slide * h, w, h }
  }
}

/** How far the box had to move to fit inside the viewBox, and the box that fits. */
function clampIntoView(box: PocketBox, o: PocketOptions): { box: PocketBox; moved: number } {
  const x = Math.min(Math.max(box.x, 0), Math.max(0, o.viewWidth - box.w))
  const y = Math.min(Math.max(box.y, 0), Math.max(0, o.viewHeight - box.h))
  return { box: { ...box, x, y }, moved: Math.abs(x - box.x) + Math.abs(y - box.y) }
}

function overlapArea(a: PocketBox, b: PocketBox, pad: number): number {
  const w = Math.min(a.x + a.w + pad, b.x + b.w + pad) - Math.max(a.x - pad, b.x - pad)
  const h = Math.min(a.y + a.h + pad, b.y + b.h + pad) - Math.max(a.y - pad, b.y - pad)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * How many sampled road points fall inside the box. The road is tested as points
 * grown by its own half-width: exact enough at the sampling density `ActPath`
 * uses (one sample per ~10 units, against a card at least 170 units on its short
 * side), and it catches the loop-back case a local tangent test cannot see.
 */
function roadHits(box: PocketBox, o: PocketOptions): number {
  const r = o.roadHalf + ROTATION_ALLOWANCE
  let hits = 0
  for (const p of o.road) {
    if (p.x > box.x - r && p.x < box.x + box.w + r && p.y > box.y - r && p.y < box.y + box.h + r) {
      hits += 1
    }
  }
  return hits
}

/**
 * The normal of the path at a point, rotated to the requested side, expressed as
 * the pocket it points into. Direction of travel is `point.angle` (degrees, SVG
 * space where +y is down), so the left of travel is angle - 90 and the right of
 * travel is angle + 90 — the same convention `facingFromAngle` reads.
 */
function pocketForSide(point: PathPoint, side: 'left' | 'right'): Pocket {
  const normal = ((point.angle + (side === 'left' ? -90 : 90)) * Math.PI) / 180
  const nx = Math.cos(normal)
  const ny = Math.sin(normal)
  if (Math.abs(ny) >= Math.abs(nx)) return ny > 0 ? 'below' : 'above'
  return nx > 0 ? 'right' : 'left'
}

const OPPOSITE: Readonly<Record<Pocket, Pocket>> = {
  above: 'below',
  below: 'above',
  left: 'right',
  right: 'left',
}

/**
 * Candidate order: the side the data asked for, its opposite, then the two
 * perpendicular pockets with the one pointing into the middle of the viewBox
 * first — on a U-turn that is the inside of the loop, which is the only free
 * space there.
 */
function candidates(point: PathPoint, side: 'left' | 'right', o: PocketOptions): Pocket[] {
  const first = pocketForSide(point, side)
  const second = OPPOSITE[first]
  const vertical = first === 'above' || first === 'below'
  const inward: Pocket = vertical
    ? point.x < o.viewWidth / 2
      ? 'right'
      : 'left'
    : point.y < o.viewHeight / 2
      ? 'below'
      : 'above'
  return [first, second, inward, OPPOSITE[inward]]
}

/**
 * Place every card for one act, in node order. Returns one placement per input,
 * in the same order.
 */
export function placePockets(
  inputs: ReadonlyArray<PocketInput>,
  o: PocketOptions,
): PocketPlacement[] {
  const placed: PocketBox[] = []
  const out: PocketPlacement[] = []

  for (const { point, side } of inputs) {
    let best: { pocket: Pocket; box: PocketBox; score: number } | null = null

    search: for (const pocket of candidates(point, side, o)) {
      for (const slide of SLIDES) {
        const { box, moved } = clampIntoView(boxFor(pocket, point, slide, o), o)

        // Weights, not magic numbers: a road hit is the thing this solver exists
        // to prevent, so one sampled hit outweighs any amount of clamping; card
        // overlap is measured as area and divided down to the same order; and
        // being dragged into frame is the mildest fault of the three.
        let score = roadHits(box, o) * 1000
        for (const other of placed) score += overlapArea(box, other, CARD_PADDING) / 40
        score += moved / 4

        if (best === null || score < best.score) best = { pocket, box, score }
        if (score === 0) break search
      }
    }

    const result = best ?? {
      pocket: 'below' as Pocket,
      box: boxFor('below', point, 0, o),
      score: Number.POSITIVE_INFINITY,
    }

    placed.push(result.box)
    out.push({
      pocket: result.pocket,
      // The overlay anchors the card by its own top-left corner (see cards.css),
      // so the percentage handed over is the box's own corner rather than the
      // point on the path. That keeps one number in play per axis instead of a
      // point plus a transform the CSS would have to agree about.
      leftPct: o.viewWidth === 0 ? 0 : (result.box.x / o.viewWidth) * 100,
      topPct: o.viewHeight === 0 ? 0 : (result.box.y / o.viewHeight) * 100,
      box: result.box,
      score: result.score,
    })
  }

  return out
}
