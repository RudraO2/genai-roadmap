import type { CSSProperties, ReactNode } from 'react'

import { usePathPoint } from '../hooks/usePathPoint.ts'
import { useWalking } from '../hooks/useWalking.ts'
import { facingFromAngle } from '../path/pointAtT.ts'
import { pointToPercent } from '../path/viewBox.ts'
import type { CharacterVariant, Facing } from '../types.ts'

export const DEFAULT_VARIANT: CharacterVariant = {
  body: 'placeholder',
  hair: 'placeholder',
  outfit: 'placeholder',
}

export interface CharacterProps {
  /** 0-1 along the enclosing act's path. The only position input. */
  t: number
  /** Omit to derive facing from the path's direction of travel at `t`. */
  facing?: Facing
  variant?: CharacterVariant
  viewBoxWidth: number
  viewBoxHeight: number
}

/**
 * The walker. Code-drawn geometric placeholder standing at `t` on its act's
 * path, positioned through `usePathPoint` and nothing else.
 *
 * The props `t`, `facing` and `variant` are frozen by
 * `prompts/00-antigravity-assets.md`: layered sprite sheets arrive later and
 * must slot in behind this exact signature. That is why the figure is three
 * stacked HTML layers in the sheet order (body → outfit → hair) sharing one
 * `animation-name`, rather than SVG shapes — the swap then changes what a layer
 * is painted with, not how it is positioned or animated.
 */
export function Character({
  t,
  facing,
  variant = DEFAULT_VARIANT,
  viewBoxWidth,
  viewBoxHeight,
}: CharacterProps): ReactNode {
  const point = usePathPoint(t)
  const walking = useWalking(t)

  if (!point) return null

  const { leftPct, topPct } = pointToPercent(point, { width: viewBoxWidth, height: viewBoxHeight })
  const resolvedFacing = facing ?? facingFromAngle(point.angle)

  // Feet on the path point: bottom-centre anchor, then mirrored in place when
  // facing left. There is no left-facing artwork, only this flip.
  const position: CSSProperties = { left: `${leftPct}%`, top: `${topPct}%` }

  return (
    <div className="character" style={position} data-facing={resolvedFacing} data-walking={walking}>
      <div className="character__layer character__layer--body" data-variant={variant.body} />
      <div className="character__layer character__layer--outfit" data-variant={variant.outfit} />
      <div className="character__layer character__layer--hair" data-variant={variant.hair} />
    </div>
  )
}
