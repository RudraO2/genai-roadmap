import { useMemo, type CSSProperties, type ReactNode } from 'react'

import { computeLayout } from '../data/layout.ts'
import { levelFit, stageStateFor, tallyFor, type PathProgress } from '../data/state.ts'
import type { LearningPath, Level, RoadmapNode, StageId } from '../types.ts'
import { GraphNode } from './GraphNode.tsx'

export interface GraphCanvasProps {
  path: LearningPath
  level: Level
  progress: PathProgress
  completed: ReadonlySet<string>
  /** Node ids left out of the layout entirely — rows close up behind them. */
  hidden: ReadonlySet<string>
  /** Stages drawn in full. Everything else is a header row you can open. */
  expanded: ReadonlySet<StageId>
  /** Ids matching the current search, or null when no search is running. */
  matches: ReadonlySet<string> | null
  visited: ReadonlySet<string>
  /** The quest opened most recently, kept after its dialog closes. */
  focusedId: string | null
  zoom: number
  onOpen: (id: string) => void
  onToggle: (id: string) => void
  onToggleStage: (stage: StageId) => void
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
 *
 * Bands the learner has not opened are drawn as their header alone. The band
 * still states its name, its kicker and its tally, so a collapsed map is a table
 * of contents rather than a hole — and it is a button, so opening one is a
 * click on the thing you were already reading.
 */
export function GraphCanvas({
  path,
  level,
  progress,
  completed,
  hidden,
  expanded,
  matches,
  visited,
  focusedId,
  zoom,
  onOpen,
  onToggle,
  onToggleStage,
}: GraphCanvasProps): ReactNode {
  const collapsed = useMemo(() => {
    const set = new Set<StageId>()
    for (const stageId of path.stages) if (!expanded.has(stageId)) set.add(stageId)
    return set
  }, [path.stages, expanded])

  const layout = useMemo(
    () => computeLayout(path.id, { hidden, completed, collapsed }),
    [path.id, hidden, completed, collapsed],
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
          const state = stageStateFor(progress, band.stage.id)
          return (
            <div
              key={band.stage.id}
              id={`stage-${band.stage.id}`}
              className="band"
              style={{ top: `${band.y}px`, height: `${band.headerHeight}px` }}
              data-stage-state={state}
              data-collapsed={band.collapsed ? 'true' : undefined}
            >
              <p className="band__kicker">
                {state === 'current' ? <span className="band__here">You are here</span> : null}
                {band.stage.kicker}
              </p>
              {/* The button lives inside the heading rather than replacing it:
                  a map of seventeen stages navigated by heading is most of how
                  a screen reader gets around it. */}
              <h3 className="band__heading">
                <button
                  type="button"
                  className="band__toggle"
                  aria-expanded={!band.collapsed}
                  onClick={() => onToggleStage(band.stage.id)}
                >
                  <span className="band__caret" aria-hidden="true">
                    {band.collapsed ? '+' : '−'}
                  </span>
                  <span className="band__title">{band.stage.title}</span>
                </button>
              </h3>
              <p className="band__tally">
                {tally.done} / {tally.total}
                {state === 'cleared' ? ' · cleared' : null}
                {band.collapsed ? ` · ${band.count} hidden` : null}
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
            visited={visited.has(laid.node.id)}
            focused={laid.node.id === focusedId}
            fit={levelFit(laid.node, level)}
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
