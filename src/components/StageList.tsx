import type { ReactNode } from 'react'

import { TYPE_LABEL } from '../constants.ts'
import { registry } from '../data/roadmap.ts'
import { levelFit, stageStateFor, tallyFor, type PathProgress } from '../data/state.ts'
import type { LearningPath, Level, NodeState, RoadmapNode, StageId } from '../types.ts'

export interface StageListProps {
  path: LearningPath
  level: Level
  progress: PathProgress
  hidden: ReadonlySet<string>
  /** Stages drawn in full. Everything else is a header row you can open. */
  expanded: ReadonlySet<StageId>
  matches: ReadonlySet<string> | null
  visited: ReadonlySet<string>
  focusedId: string | null
  onOpen: (id: string) => void
  onToggle: (id: string) => void
  onToggleStage: (stage: StageId) => void
}

const STATE_LABEL: Readonly<Record<NodeState, string>> = {
  done: 'Done',
  ready: 'Ready',
  locked: 'Locked',
}

/**
 * The same roadmap as a reading list, stage by stage.
 *
 * Not a fallback that loses information: it carries the blurb the boxes have no
 * room for, and it is the better view on a phone and for a screen reader, where a
 * grid of absolutely positioned cards is a worse experience than a list of
 * headings. The map is chosen automatically on wide screens, and either can be
 * chosen by hand.
 *
 * It collapses on exactly the same rule the map does, from the same set, so
 * switching views never changes what is open — a stage you opened on the map is
 * still open here, and the two views cannot disagree about where you are.
 */
export function StageList({
  path,
  level,
  progress,
  hidden,
  expanded,
  matches,
  visited,
  focusedId,
  onOpen,
  onToggle,
  onToggleStage,
}: StageListProps): ReactNode {
  return (
    <div className="stagelist">
      {path.stages.map((stageId, index) => {
        const stage = registry.getStage(stageId)
        const nodes = registry.nodesInStage(stageId).filter((node) => !hidden.has(node.id))
        if (nodes.length === 0) return null
        const tally = tallyFor(progress, stageId)
        const state = stageStateFor(progress, stageId)
        const open = expanded.has(stageId)

        return (
          <section
            className="stagelist__stage"
            key={stageId}
            id={`stage-${stageId}`}
            data-stage-state={state}
            data-collapsed={open ? undefined : 'true'}
          >
            <header className="stagelist__head">
              <p className="stagelist__kicker">
                <span className="stagelist__index">{String(index + 1).padStart(2, '0')}</span>
                {state === 'current' ? (
                  <span className="stagelist__here">You are here</span>
                ) : null}
                {stage.kicker}
              </p>
              <h3 className="stagelist__heading">
                <button
                  type="button"
                  className="stagelist__toggle"
                  aria-expanded={open}
                  onClick={() => onToggleStage(stageId)}
                >
                  <span className="stagelist__caret" aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                  <span className="stagelist__title">{stage.title}</span>
                </button>
              </h3>
              <p className="stagelist__summary">{stage.summary}</p>
              <p className="stagelist__tally">
                {tally.done} / {tally.total} done · {tally.xp} / {tally.xpTotal} XP
                {state === 'cleared' ? ' · cleared' : null}
                {open ? null : ` · ${nodes.length} quests hidden`}
              </p>
            </header>
            {open ? (
              <ul className="stagelist__nodes">
                {nodes.map((node: RoadmapNode) => {
                  const nodeState = progress.states.get(node.id) ?? 'locked'
                  const isNext = progress.next?.id === node.id
                  const fit = levelFit(node, level)
                  const seen = visited.has(node.id)
                  return (
                    <li
                      key={node.id}
                      id={`quest-${node.id}`}
                      className="qrow"
                      data-state={nodeState}
                      data-type={node.type}
                      data-next={isNext ? 'true' : undefined}
                      data-visited={seen ? 'true' : undefined}
                      data-focused={node.id === focusedId ? 'true' : undefined}
                      data-dimmed={matches !== null && !matches.has(node.id) ? 'true' : undefined}
                    >
                      <button
                        type="button"
                        className="qrow__tick"
                        aria-pressed={nodeState === 'done'}
                        aria-label={
                          nodeState === 'done'
                            ? `Mark ${node.title} not done`
                            : `Mark ${node.title} done`
                        }
                        onClick={() => onToggle(node.id)}
                      >
                        <span aria-hidden="true">{nodeState === 'done' ? '✓' : ''}</span>
                      </button>
                      <button type="button" className="qrow__open" onClick={() => onOpen(node.id)}>
                        <span className="qrow__title">{node.title}</span>
                        <span className="qrow__blurb">{node.blurb}</span>
                        <span className="qrow__meta">
                          {TYPE_LABEL[node.type]} · {node.est} · {node.xp} XP ·{' '}
                          {node.id === focusedId
                            ? 'Last opened'
                            : isNext
                              ? 'Do this next'
                              : STATE_LABEL[nodeState]}
                          {fit === 'match' ? null : ` · ${fit}`}
                          {seen && node.id !== focusedId ? ' · opened' : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
