import type { ReactNode } from 'react'

import { usePathPoint } from '../hooks/usePathPoint.ts'
import type { PlacedNode } from '../types.ts'

export interface PathNodeProps {
  placed: PlacedNode
}

/**
 * One bare dot marking a node's position on the path. No label: spec 05's
 * `NodeCard` carries the title now, positioned from this same `t`, and a
 * second copy of the title here overlapped it (found by screenshot). No
 * completion state — spec 08 adds that.
 */
export function PathNode({ placed }: PathNodeProps): ReactNode {
  const point = usePathPoint(placed.t)
  if (!point) return null

  return (
    <g className="path-node" transform={`translate(${point.x} ${point.y})`}>
      <circle className="path-node__dot" r={5} />
    </g>
  )
}
