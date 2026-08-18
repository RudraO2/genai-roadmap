/**
 * Pure position math for one point on a mounted SVG path. No React here — this
 * is the one implementation `usePathPoint` wraps, so nothing downstream (fog of
 * war, the character, completed glow) recomputes a position a second way.
 */

import type { Facing } from '../types.ts'

export interface PathPoint {
  x: number
  y: number
  /** Degrees. Facing direction of travel at this point on the path. */
  angle: number
}

const ANGLE_EPSILON = 0.001

export function pointAtT(path: SVGPathElement, totalLength: number, t: number): PathPoint {
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const tc = clamp(t)
  const point = path.getPointAtLength(totalLength * tc)

  const atEnd = tc >= 1
  const sampleT = clamp(atEnd ? tc - ANGLE_EPSILON : tc + ANGLE_EPSILON)
  const sample = path.getPointAtLength(totalLength * sampleT)

  const dx = atEnd ? point.x - sample.x : sample.x - point.x
  const dy = atEnd ? point.y - sample.y : sample.y - point.y

  return {
    x: point.x,
    y: point.y,
    angle: Math.atan2(dy, dx) * (180 / Math.PI),
  }
}

/**
 * Direction of travel at a point, as a facing. Degrees come from `pointAtT`'s
 * `atan2` — turning them into left/right here keeps the character from doing
 * its own trigonometry. Straight up or straight down (±90) resolves to
 * `'right'`; there is no third facing to fall through to.
 */
export function facingFromAngle(angle: number): Facing {
  return Math.abs(angle) <= 90 ? 'right' : 'left'
}
