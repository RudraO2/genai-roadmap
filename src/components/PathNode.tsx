import type { ReactNode } from 'react'

import { dormancyOf } from '../data/dormancy.ts'
import type { NodeProgressState } from '../data/progress.ts'
import { registry } from '../data/registry.ts'
import { usePathPoint } from '../hooks/usePathPoint.ts'
import type { PlacedNode } from '../types.ts'

export interface PathNodeProps {
  placed: PlacedNode
  /** 1-based position within the act or branch. Drawn inside the dot. */
  stop: number
  /**
   * Drawn state of the dot. Derived once by `computeTrackProgress`, never here.
   * Exactly one dot on a track is `current`, and it is never on a branch.
   */
  state: NodeProgressState
  /** A frontier branch spurs off this node: draw the ring that says so. */
  anchor?: boolean
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
 *
 * Zone and dormancy are read from the registry rather than passed down: they
 * are facts about the node, identical on every path that places it, and the
 * same read `NodeCard` already makes. Only `anchor` is a prop, because it is a
 * fact about this *track's* branches and belongs to the one derivation
 * (`computeTrackProgress`) that decides what the map draws.
 */
export function PathNode({ placed, stop, state, anchor = false }: PathNodeProps): ReactNode {
  const point = usePathPoint(placed.t)
  if (!point) return null

  const node = registry.getNode(placed.id)
  const { dormant } = dormancyOf(node)

  return (
    <g
      className="path-node"
      transform={`translate(${point.x} ${point.y})`}
      data-state={state}
      data-zone={node.zone}
      data-dormant={dormant ? 'true' : undefined}
    >
      {/* The radii are tokens in path.css (`r: var(--dot-r)`); these attributes
          are the fallback for engines that do not implement `r` as a CSS
          geometry property, and are kept equal to the token values. */}
      {anchor ? <circle className="path-node__anchor" r={20} /> : null}
      <circle className="path-node__dot" r={13} />
      {/* dominant-baseline centres the digits on the dot's own centre, so the
          number does not need a hand-tuned dy that would drift with the size
          token. */}
      <text className="path-node__stop" textAnchor="middle" dominantBaseline="central">
        {String(stop).padStart(2, '0')}
      </text>
    </g>
  )
}
