import type { ReactNode } from 'react'

import { TYPE_LABEL } from '../constants.ts'
import { formatHours } from '../data/duration.ts'
import { registry } from '../data/roadmap.ts'
import { stateOf, tallyFor, type PathProgress } from '../data/state.ts'
import type { LearningPath, Level } from '../types.ts'

export interface PrintSheetProps {
  path: LearningPath
  level: Level
  progress: PathProgress
  completed: ReadonlySet<string>
}

/**
 * The roadmap as paper.
 *
 * `DESIGN.md` sets one test for this project — *would this look at home as a
 * printed road atlas or a wall poster for a course?* — and until now the answer
 * for the literal case was no: printing the app produced a screenshot of an
 * interface, with a sticky bar, a search box and nine collapsed stages.
 *
 * This is a separate document rather than a print stylesheet over the screen,
 * and that is the whole design. A print stylesheet can only hide and re-space
 * what the screen happens to be showing, which means the output depends on which
 * stages you had open and which view you were in. A sheet of its own always
 * prints the same thing: every stage, every quest, in order, with a box to tick
 * and the URL spelled out — because on paper you cannot click a link.
 *
 * `display: none` on screen, which also keeps it out of the accessibility tree,
 * so nothing here is read twice.
 */
export function PrintSheet({ path, level, progress, completed }: PrintSheetProps): ReactNode {
  const { overall, percent, hoursLeft } = progress

  return (
    <div className="printsheet" aria-hidden="true">
      <header className="printsheet__head">
        <p className="printsheet__eyebrow">The Gen AI Roadmap</p>
        <h1 className="printsheet__title">{path.title}</h1>
        <p className="printsheet__goal">{path.goal}</p>
        <p className="printsheet__meta">
          {level} · {overall.done}/{overall.total} done · {percent}% · ≈{formatHours(hoursLeft)}{' '}
          left · registry checked {registry.generated}
        </p>
      </header>

      {path.stages.map((stageId, index) => {
        const stage = registry.getStage(stageId)
        const nodes = registry.nodesInStage(stageId)
        if (nodes.length === 0) return null
        const tally = tallyFor(progress, stageId)

        return (
          <section className="printsheet__stage" key={stageId}>
            <h2 className="printsheet__stage-title">
              <span className="printsheet__index">{String(index + 1).padStart(2, '0')}</span>
              {stage.title}
              <span className="printsheet__tally">
                {tally.done}/{tally.total}
              </span>
            </h2>
            <p className="printsheet__kicker">{stage.kicker}</p>

            <ul className="printsheet__quests">
              {nodes.map((node) => {
                const done = stateOf(node, completed) === 'done'
                // One destination per quest, not all 196 in the registry: the
                // first verified link is the one this quest is actually about,
                // and a page of bare URLs is not a checklist.
                const link = node.links.find((candidate) => candidate.verified) ?? node.links[0]
                return (
                  <li className="printsheet__quest" key={node.id}>
                    <span className="printsheet__box">{done ? '×' : ''}</span>
                    <span className="printsheet__quest-body">
                      <span className="printsheet__quest-title">{node.title}</span>
                      <span className="printsheet__quest-meta">
                        {TYPE_LABEL[node.type]} · {node.est} · {node.xp} XP · {node.level}
                      </span>
                      <span className="printsheet__quest-blurb">{node.blurb}</span>
                      <span className="printsheet__quest-mission">{node.mission}</span>
                      {link ? <span className="printsheet__quest-link">{link.url}</span> : null}
                    </span>
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
