import { useState, type CSSProperties, type ReactNode } from 'react'

import { LEVEL_RANK } from '../constants.ts'
import { dormancyOf } from '../data/dormancy.ts'
import { useProgressContext } from '../data/ProgressContext.ts'
import { registry } from '../data/registry.ts'
import { usePathPoint } from '../hooks/usePathPoint.ts'
import { pointToPercent } from '../path/viewBox.ts'
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
 * The completion toggle reads and writes the one shared set (spec 08) through
 * `ProgressContext`, so the dot, the fog strokes, the walker and this button
 * can never disagree. The markup, class names, `aria-pressed` and the two
 * labels are exactly what spec 05 shipped; only the state source changed.
 *
 * The detail panel (spec 06) is also local state: whether *this* card's
 * `NodePanel` is open. It does not lift to `TrackMap`/`App` — only one
 * `<dialog>` is ever the caller's, and the native `<dialog>` itself already
 * guarantees only one can be the top layer's modal at a time.
 *
 * A dormant node (spec 09) greys out, says so, and names its successor when the
 * registry knows one. It is not hidden, not moved and not made unclickable:
 * CONTEXT.md section 6 keeps dead tools visible because knowing a tool is dead
 * is useful information.
 */
export function NodeCard({
  placed,
  viewBoxWidth,
  viewBoxHeight,
  learnerLevel,
}: NodeCardProps): ReactNode {
  const point = usePathPoint(placed.t)
  const { completed, toggle } = useProgressContext()
  const [expanded, setExpanded] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  if (!point) return null

  const complete = completed.has(placed.id)

  const node = registry.getNode(placed.id)
  const belowLearnerLevel = LEVEL_RANK[node.level] < LEVEL_RANK[learnerLevel]
  const collapsed = belowLearnerLevel && !expanded
  const { dormant } = dormancyOf(node)
  const successor = node.successor ? registry.nodesById.get(node.successor) : undefined
  const dormantClass = dormant ? ' node-card--dormant' : ''

  const { leftPct, topPct } = pointToPercent(point, {
    width: viewBoxWidth,
    height: viewBoxHeight,
  })
  const position: CSSProperties =
    placed.side === 'left'
      ? { right: `${100 - leftPct}%`, top: `${topPct}%` }
      : { left: `${leftPct}%`, top: `${topPct}%` }

  if (collapsed) {
    return (
      <div
        className={`node-card node-card--stub node-card--${placed.side}${dormantClass}`}
        style={position}
      >
        <button type="button" className="node-card__stub-expand" onClick={() => setExpanded(true)}>
          {node.title}
        </button>
      </div>
    )
  }

  return (
    <article className={`node-card node-card--${placed.side}${dormantClass}`} style={position}>
      <p className="node-card__level">
        {node.level}
        {dormant ? <span className="node-card__dormant"> / dormant</span> : null}
      </p>
      <button
        type="button"
        className="node-card__title-button"
        onClick={() => setDetailOpen(true)}
      >
        <h3 className="node-card__title">{node.title}</h3>
      </button>
      <p className="node-card__blurb">{node.blurb}</p>
      {successor ? (
        <p className="node-card__successor">Superseded by {successor.title}</p>
      ) : null}
      <div className="node-card__foot">
        <button
          type="button"
          className="node-card__complete"
          aria-pressed={complete}
          onClick={() => toggle(placed.id)}
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
