import type { ReactNode } from 'react'

import { registry } from '../data/roadmap.ts'
import { stageStateFor, tallyFor, type PathProgress } from '../data/state.ts'
import type { LearningPath, StageId } from '../types.ts'

export interface StageRailProps {
  path: LearningPath
  progress: PathProgress
  /** Stages currently drawn in full. Rail chips say which, so it is never a guess. */
  expanded: ReadonlySet<StageId>
  /** Open a stage and scroll to it. */
  onJump: (stage: StageId) => void
}

/**
 * The stage stepper: the whole path as one row of chips, always in reach.
 *
 * It does two jobs that the map on its own could not. It answers "where am I" —
 * one chip is marked *here*, and the chips before it are ticked — and it makes
 * the path traversable without scrolling through it, which on a fifty-nine
 * quest map is the difference between navigating and hunting.
 *
 * It also reports which stages are open, so the collapse state of the map is
 * legible from a single line rather than discovered by scrolling.
 */
export function StageRail({ path, progress, expanded, onJump }: StageRailProps): ReactNode {
  return (
    <nav className="rail" aria-label="Stages">
      <ol className="rail__list">
        {path.stages.map((stageId, index) => {
          const stage = registry.getStage(stageId)
          const tally = tallyFor(progress, stageId)
          if (tally.total === 0) return null
          const state = stageStateFor(progress, stageId)
          return (
            <li key={stageId}>
              <button
                type="button"
                className="rail__chip"
                data-stage-state={state}
                data-open={expanded.has(stageId) ? 'true' : undefined}
                aria-current={state === 'current' ? 'step' : undefined}
                onClick={() => onJump(stageId)}
              >
                <span className="rail__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="rail__title">{stage.title}</span>
                <span className="rail__tally">
                  {tally.done}/{tally.total}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
