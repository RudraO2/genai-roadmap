import type { ReactNode } from 'react'

import { TYPE_LABEL } from '../constants.ts'
import { registry } from '../data/roadmap.ts'
import { tallyFor, type PathProgress } from '../data/state.ts'
import type { LearningPath, NodeState, RoadmapNode } from '../types.ts'

export interface StageListProps {
  path: LearningPath
  progress: PathProgress
  hidden: ReadonlySet<string>
  matches: ReadonlySet<string> | null
  onOpen: (id: string) => void
  onToggle: (id: string) => void
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
 */
export function StageList({
  path,
  progress,
  hidden,
  matches,
  onOpen,
  onToggle,
}: StageListProps): ReactNode {
  return (
    <div className="stagelist">
      {path.stages.map((stageId, index) => {
        const stage = registry.getStage(stageId)
        const nodes = registry.nodesInStage(stageId).filter((node) => !hidden.has(node.id))
        if (nodes.length === 0) return null
        const tally = tallyFor(progress, stageId)
        const cleared = tally.total > 0 && tally.done === tally.total

        return (
          <section className="stagelist__stage" key={stageId} data-cleared={cleared ? 'true' : undefined}>
            <header className="stagelist__head">
              <p className="stagelist__kicker">
                <span className="stagelist__index">{String(index + 1).padStart(2, '0')}</span>
                {stage.kicker}
              </p>
              <h3 className="stagelist__title">{stage.title}</h3>
              <p className="stagelist__summary">{stage.summary}</p>
              <p className="stagelist__tally">
                {tally.done} / {tally.total} done · {tally.xp} / {tally.xpTotal} XP
              </p>
            </header>
            <ul className="stagelist__nodes">
              {nodes.map((node: RoadmapNode) => {
                const state = progress.states.get(node.id) ?? 'locked'
                const isNext = progress.next?.id === node.id
                return (
                  <li
                    key={node.id}
                    className="qrow"
                    data-state={state}
                    data-type={node.type}
                    data-next={isNext ? 'true' : undefined}
                    data-dimmed={matches !== null && !matches.has(node.id) ? 'true' : undefined}
                  >
                    <button
                      type="button"
                      className="qrow__tick"
                      aria-pressed={state === 'done'}
                      aria-label={state === 'done' ? `Mark ${node.title} not done` : `Mark ${node.title} done`}
                      onClick={() => onToggle(node.id)}
                    >
                      <span aria-hidden="true">{state === 'done' ? '✓' : ''}</span>
                    </button>
                    <button type="button" className="qrow__open" onClick={() => onOpen(node.id)}>
                      <span className="qrow__title">{node.title}</span>
                      <span className="qrow__blurb">{node.blurb}</span>
                      <span className="qrow__meta">
                        {TYPE_LABEL[node.type]} · {node.level} · {node.est} · {node.xp} XP ·{' '}
                        {isNext ? 'Do this next' : STATE_LABEL[state]}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
