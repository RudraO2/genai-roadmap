import type { ReactNode } from 'react'

import { registry } from '../data/registry.ts'
import { usePathPoint } from '../hooks/usePathPoint.ts'
import type { PlacedNode } from '../types.ts'

export interface PathNodeProps {
  placed: PlacedNode
}

/** One bare dot plus a mono label. No card, no completion state — spec 05/08 add those. */
export function PathNode({ placed }: PathNodeProps): ReactNode {
  const point = usePathPoint(placed.t)
  if (!point) return null

  const node = registry.getNode(placed.id)
  const labelOffset = placed.side === 'left' ? -14 : 14
  const anchor = placed.side === 'left' ? 'end' : 'start'

  return (
    <g className="path-node" transform={`translate(${point.x} ${point.y})`}>
      <circle className="path-node__dot" r={5} />
      <text className="path-node__label" x={labelOffset} dy="0.32em" textAnchor={anchor}>
        {node.title}
      </text>
    </g>
  )
}
