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
 * The walker. A sprite-backed character standing at `t` on its act's path,
 * positioned through `usePathPoint` and nothing else.
 *
 * The props `t`, `facing` and `variant` are frozen by
 * `prompts/00-antigravity-assets.md`, so alternate sheets can arrive without
 * changing the path-following interface. The first production asset is a
 * single composited four-frame sheet; later layered variants can replace its
 * inner element while retaining this wrapper and its coordinates.
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
      {/* Keep the public variant input while the first production sheet is a
          unified character. Additional body/outfit/hair sheets can still slot
          in here later without changing the path-following contract. */}
      <div className="character__sprite" data-variant={`${variant.body}-${variant.outfit}-${variant.hair}`} />
    </div>
  )
}
