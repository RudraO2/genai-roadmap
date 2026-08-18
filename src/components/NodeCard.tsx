import { useState, type CSSProperties, type ReactNode } from 'react'

import { LEVEL_RANK } from '../constants.ts'
import { registry } from '../data/registry.ts'
import { usePathPoint } from '../hooks/usePathPoint.ts'
import type { Level, PlacedNode } from '../types.ts'
import { NodePanel } from './NodePanel.tsx'

export interface NodeCardProps {
  placed: PlacedNode
  viewBoxWidth: number
  viewBoxHeight: number
  learnerLevel: Level
}

/**
 * The card (or, below the learner's level, a hairline stub) for one placed
 * node. Positions itself from `usePathPoint(placed.t)` — the same call
 * `PathNode` makes — converted to a percentage of the act's viewBox. Never
 * takes x/y as a prop; there is exactly one position implementation.
 *
 * The completion toggle here is local state only. Spec 08 replaces it with a
 * localStorage-backed version behind the same markup and class names.
 *
 * The detail panel (spec 06) is also local state: whether *this* card's
 * `NodePanel` is open. It does not lift to `TrackMap`/`App` — only one
 * `<dialog>` is ever the caller's, and the native `<dialog>` itself already
 * guarantees only one can be the top layer's modal at a time.
 */
export function NodeCard({
  placed,
  viewBoxWidth,
  viewBoxHeight,
  learnerLevel,
}: NodeCardProps): ReactNode {
  const point = usePathPoint(placed.t)
  const [expanded, setExpanded] = useState(false)
  const [complete, setComplete] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  if (!point) return null

  const node = registry.getNode(placed.id)
  const belowLearnerLevel = LEVEL_RANK[node.level] < LEVEL_RANK[learnerLevel]
  const collapsed = belowLearnerLevel && !expanded

  const leftPct = (point.x / viewBoxWidth) * 100
  const topPct = (point.y / viewBoxHeight) * 100
  const position: CSSProperties =
    placed.side === 'left'
      ? { right: `${100 - leftPct}%`, top: `${topPct}%` }
      : { left: `${leftPct}%`, top: `${topPct}%` }

  if (collapsed) {
    return (
      <div className={`node-card node-card--stub node-card--${placed.side}`} style={position}>
        <button type="button" className="node-card__stub-expand" onClick={() => setExpanded(true)}>
          {node.title}
        </button>
      </div>
    )
  }

  return (
    <article className={`node-card node-card--${placed.side}`} style={position}>
      <p className="node-card__level">{node.level}</p>
      <button
        type="button"
        className="node-card__title-button"
        onClick={() => setDetailOpen(true)}
      >
        <h3 className="node-card__title">{node.title}</h3>
      </button>
      <p className="node-card__blurb">{node.blurb}</p>
      <div className="node-card__foot">
        <button
          type="button"
          className="node-card__complete"
          aria-pressed={complete}
          onClick={() => setComplete((c) => !c)}
        >
          {complete ? 'Done' : 'Mark done'}
        </button>
        {belowLearnerLevel ? (
          <button type="button" className="node-card__collapse" onClick={() => setExpanded(false)}>
            Collapse
          </button>
        ) : null}
      </div>
      <NodePanel node={node} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </article>
  )
}
