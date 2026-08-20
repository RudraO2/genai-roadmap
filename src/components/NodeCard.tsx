import { useState, type CSSProperties, type ReactNode } from 'react'

import { LEVEL_RANK } from '../constants.ts'
import { dormancyOf } from '../data/dormancy.ts'
import { useProgressContext } from '../data/ProgressContext.ts'
import { registry } from '../data/registry.ts'
import { useJustCompleted } from '../hooks/useJustCompleted.ts'
import type { PocketPlacement } from '../path/pockets.ts'
import type { Level, Node, PlacedNode } from '../types.ts'
import { NodePanel } from './NodePanel.tsx'

export interface NodeCardProps {
  placed: PlacedNode
  /** 1-based position of this node within its act or branch. */
  stop: number
  /**
   * Where the solver put this card, or null when the caller stacks its cards in
   * flow and there is no pocket to sit in (every frontier spur, at every width).
   * `ActPath` owns placement; a card never computes its own position — there is
   * exactly one placement implementation and it is `placePockets`.
   */
  placement: PocketPlacement | null
  learnerLevel: Level
}

/**
 * Which paper this node's card is printed on. CONTEXT.md section 8, as amended by
 * spec 13, requires the colour to come from the node's data and bans assigning it
 * by position in a list:
 *
 *   dormant      grey    — no commits in twelve months. Still on the map (section 6).
 *   repo         lime
 *   docs         blue
 *   playground   lilac
 *   article / thread / video   orange
 *
 * The axis is the *kind of the node's first link* — what the learner is about to
 * open. Level was the obvious first choice and was wrong: the acts ramp, so an
 * act's nodes almost all share a level, and every screen came out one flat
 * colour. Kind varies inside an act and carries information the learner cannot
 * get from the map's shape (a playground is a different afternoon from a repo).
 * Level has not lost its voice — it is printed on the card beside the kind, and
 * it is still what collapses a node to a stub.
 *
 * Dormancy overrides, because a dead tool is dead first and a repo second. The
 * frontier does *not* override: a spur's cards keep their kind and say "unproven"
 * with a dashed ink border, so colour never has to mean two things at once.
 *
 * A node's links are ordered by the registry, and a node always has at least one
 * (`validate.ts` rejects an empty `links` array), so the first link is a stable
 * fact: the same node prints on the same paper on every track that places it.
 */
function paperFor(node: Node, dormant: boolean): string {
  if (dormant) return 'grey'
  switch (node.links[0]?.kind) {
    case 'repo':
      return 'lime'
    case 'docs':
      return 'blue'
    case 'playground':
      return 'lilac'
    default:
      return 'orange'
  }
}

/**
 * The card (or, below the learner's level, a collapsed stub) for one placed node.
 *
 * The completion toggle reads and writes the one shared set (spec 08) through
 * `ProgressContext`, so the dot, the fog strokes, the walker and this button
 * can never disagree.
 *
 * The detail panel (spec 06) is local state: whether *this* card's `NodePanel` is
 * open. It does not lift to `TrackMap`/`App` — only one `<dialog>` is ever the
 * caller's, and the native `<dialog>` itself already guarantees only one can be
 * the top layer's modal at a time.
 *
 * A dormant node (spec 09) prints on grey paper, says so, and names its successor
 * when the registry knows one. It is not hidden, not moved and not made
 * unclickable: CONTEXT.md section 6 keeps dead tools visible because knowing a
 * tool is dead is useful information.
 *
 * Two reward moments (spec 14), both one-shot and both gated on an actual state
 * change rather than on render:
 *
 *   - `useJustCompleted` watches `complete` and is true for one animation only on
 *     the click that *finishes* a node — not on mount with it already complete,
 *     not on un-marking it. `data-just-completed` drives the stamp keyframe on
 *     the button in `cards.css`.
 *   - `data-revealed` is set only when `belowLearnerLevel && expanded` — a state
 *     reachable *only* through the stub's own expand click, never on first paint
 *     — so the reveal animation plays exactly once, on the click that plays it,
 *     and a card at or above the learner's level never carries it at all.
 *
 * The stop number is the wayfinding spec 13 added. It is the same number `PathNode`
 * draws inside the dot, which is what lets a card sit some distance from its dot
 * (the solver slides cards to keep them off the road) without the reader losing
 * which stop it belongs to — and what makes the stacked layout under 78rem, where
 * there are no pockets at all, still legible as a route.
 */
export function NodeCard({ placed, stop, placement, learnerLevel }: NodeCardProps): ReactNode {
  const { completed, toggle } = useProgressContext()
  const [expanded, setExpanded] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const complete = completed.has(placed.id)
  const justCompleted = useJustCompleted(complete)

  const node = registry.getNode(placed.id)
  const belowLearnerLevel = LEVEL_RANK[node.level] < LEVEL_RANK[learnerLevel]
  const collapsed = belowLearnerLevel && !expanded
  const { dormant } = dormancyOf(node)
  const successor = node.successor ? registry.nodesById.get(node.successor) : undefined

  // The solver hands over the card's own top-left corner, already cleared of the
  // road and of every card placed before it, so there is no transform to agree
  // about here. `data-pocket` exists only so the stylesheet can tilt the paper
  // away from the road it sits beside. Both are absent in a stacked context,
  // where the card is a block in normal flow and owns neither.
  const position: CSSProperties | undefined = placement
    ? { left: `${placement.leftPct}%`, top: `${placement.topPct}%` }
    : undefined

  const shared = {
    style: position,
    'data-pocket': placement?.pocket,
    'data-paper': paperFor(node, dormant),
    'data-zone': node.zone,
    'data-dormant': dormant ? 'true' : undefined,
    'data-complete': complete ? 'true' : undefined,
    'data-just-completed': justCompleted ? 'true' : undefined,
  }

  const stopLabel = String(stop).padStart(2, '0')

  if (collapsed) {
    return (
      <div className="node-card node-card--stub" {...shared}>
        <span className="node-card__stop">{stopLabel}</span>
        <button type="button" className="node-card__stub-expand" onClick={() => setExpanded(true)}>
          {node.title}
        </button>
      </div>
    )
  }

  return (
    <article className="node-card" {...shared} data-revealed={belowLearnerLevel ? 'true' : undefined}>
      <p className="node-card__head">
        <span className="node-card__stop">{stopLabel}</span>
        {/* The card's paper in words, so the colour system is never the only
            way to read it: level, then the kind the paper is chosen from. */}
        <span className="node-card__level">
          {node.level}
          {node.links[0] ? ` / ${node.links[0].kind}` : null}
          {dormant ? <span className="node-card__dormant"> / dormant</span> : null}
        </span>
      </p>
      <button type="button" className="node-card__title-button" onClick={() => setDetailOpen(true)}>
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
