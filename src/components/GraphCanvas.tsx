import { useMemo, type CSSProperties, type ReactNode } from 'react'

import { computeLayout } from '../data/layout.ts'
import { tallyFor, type PathProgress } from '../data/state.ts'
import type { LearningPath, RoadmapNode } from '../types.ts'
import { GraphNode } from './GraphNode.tsx'

export interface GraphCanvasProps {
  path: LearningPath
  progress: PathProgress
  completed: ReadonlySet<string>
  /** Node ids left out of the layout entirely — rows close up behind them. */
  hidden: ReadonlySet<string>
  /** Ids matching the current search, or null when no search is running. */
  matches: ReadonlySet<string> | null
  zoom: number
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}

/**
 * The map: stage bands, routed prerequisite edges, and a box per quest.
 *
 * Three layers, in this order, and the order is load-bearing:
 *
 *   1. the edges, in one SVG sized to the whole canvas
 *   2. the stage headers, which are opaque so an edge passing a band boundary
 *      slips behind the label rather than crossing it
 *   3. the quest boxes
 *
 * Zoom is a transform on the inner canvas with the outer box sized to match, so
 * the scrollbars stay honest at every scale and nothing inside has to know the
 * scale exists.
 */
export function GraphCanvas({
  path,
  progress,
  completed,
  hidden,
  matches,
  zoom,
  onOpen,
  onToggle,
}: GraphCanvasProps): ReactNode {
  const layout = useMemo(
    () => computeLayout(path.id, { hidden, completed }),
    [path.id, hidden, completed],
  )

  const outer: CSSProperties = {
    width: `${layout.width * zoom}px`,
    height: `${layout.height * zoom}px`,
  }
  const inner: CSSProperties = {
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    transform: `scale(${zoom})`,
  }

  const nextId = progress.next?.id ?? null

  return (
    <div className="graph" style={outer}>
      <div className="graph__canvas" style={inner}>
        <svg
          className="graph__edges"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          aria-hidden="true"
          focusable="false"
        >
          {layout.edges.map((edge) => (
            <path
              key={edge.id}
              className="graph__edge"
              d={edge.d}
              data-state={edge.state}
              data-optional={edge.optional ? 'true' : undefined}
            />
          ))}
        </svg>

        {layout.bands.map((band) => {
          const tally = tallyFor(progress, band.stage.id)
          const cleared = tally.total > 0 && tally.done === tally.total
          return (
            <div
              key={band.stage.id}
              className="band"
              style={{ top: `${band.y}px`, height: `${band.headerHeight}px` }}
              data-cleared={cleared ? 'true' : undefined}
            >
              <p className="band__kicker">{band.stage.kicker}</p>
              <h3 className="band__title">{band.stage.title}</h3>
              <p className="band__tally">
                {tally.done} / {tally.total}
                {cleared ? ' · cleared' : null}
              </p>
            </div>
          )
        })}

        {[...layout.nodes.values()].map((laid) => (
          <GraphNode
            key={laid.node.id}
            laid={laid}
            state={progress.states.get(laid.node.id) ?? 'locked'}
            isNext={laid.node.id === nextId}
            dimmed={matches !== null && !matches.has(laid.node.id)}
            onOpen={onOpen}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

/** Ids of the nodes a search term matches. Title, blurb, tags and stage all count. */
export function matchNodes(nodes: readonly RoadmapNode[], term: string): Set<string> {
  const needle = term.trim().toLowerCase()
  const found = new Set<string>()
  if (needle === '') return found
  for (const node of nodes) {
    const haystack = `${node.title} ${node.blurb} ${node.mission} ${node.tags.join(' ')}`
    if (haystack.toLowerCase().includes(needle)) found.add(node.id)
  }
  return found
}
