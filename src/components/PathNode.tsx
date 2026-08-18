import type { ReactNode } from 'react'

import type { NodeProgressState } from '../data/progress.ts'
import { usePathPoint } from '../hooks/usePathPoint.ts'
import type { PlacedNode } from '../types.ts'

export interface PathNodeProps {
  placed: PlacedNode
  /**
   * Drawn state of the dot. Derived once by `computeTrackProgress`, never here.
   * Exactly one dot on a track is `current`.
   */
  state: NodeProgressState
}

/**
 * One dot marking a node's position on the path. No label: spec 05's `NodeCard`
 * carries the title now, positioned from this same `t`, and a second copy of
 * the title here overlapped it (found by screenshot).
 *
 * The dot is the only place an out-of-order completion shows. The strokes draw
 * the act's completed *prefix*, so a node finished ahead of its neighbours
 * lights its own dot and leaves the line where it was — an honest picture of
 * what the learner actually did.
 */
export function PathNode({ placed, state }: PathNodeProps): ReactNode {
  const point = usePathPoint(placed.t)
  if (!point) return null

  return (
    <g className="path-node" transform={`translate(${point.x} ${point.y})`} data-state={state}>
      <circle className="path-node__dot" r={5} />
    </g>
  )
}
