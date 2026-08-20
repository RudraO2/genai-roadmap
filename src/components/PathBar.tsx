import type { ReactNode } from 'react'

import { registry } from '../data/roadmap.ts'
import type { PathProgress } from '../data/state.ts'
import type { LearningPath, Level, StageId } from '../types.ts'
import { StageRail } from './StageRail.tsx'

export interface PathBarProps {
  path: LearningPath
  level: Level
  progress: PathProgress
  expanded: ReadonlySet<StageId>
  onJump: (stage: StageId) => void
}

/**
 * The one thing on the map screen that never scrolls away.
 *
 * A map you can get lost in is a map that has stopped working, and the previous
 * version had exactly two places that said which of the four paths you were on:
 * a line of small type at the very top, and a percentage in the masthead. Six
 * thousand pixels later, both were gone.
 *
 * So this sticks to the top of the viewport and holds the three facts a learner
 * needs at any scroll position: which path this is — stated in that path's own
 * colour, the same colour as the card they picked — where in it they are
 * standing, and how far along they are. The stage stepper underneath turns all
 * of that from a readout into a way to move.
 *
 * The progress bar is the action accent, not the path colour: it means done,
 * which is the one thing the accent is for, and it must keep meaning that on
 * all four paths.
 */
export function PathBar({ path, level, progress, expanded, onJump }: PathBarProps): ReactNode {
  const { overall, percent, rank, currentStage } = progress
  const stage = currentStage === null ? null : registry.getStage(currentStage)
  const complete = overall.total > 0 && overall.done === overall.total

  return (
    <div className="pathbar">
      <div className="pathbar__row">
        <p className="pathbar__id">
          <span className="pathbar__chip">{path.title}</span>
          <span className="pathbar__level">{level}</span>
        </p>

        <p className="pathbar__here">
          <span className="pathbar__here-label">{complete ? 'Finished' : 'You are here'}</span>
          <span className="pathbar__here-stage">{complete ? path.title : (stage?.title ?? '—')}</span>
        </p>

        <p className="pathbar__score">
          <span
            className="pathbar__meter"
            role="img"
            aria-label={`${percent} per cent of this path complete`}
          >
            {/* Width is the one geometric value in this component, and it is
                data — the fraction itself — so it is an inline style rather
                than a class per five per cent. */}
            <span className="pathbar__meter-fill" style={{ width: `${percent}%` }} />
          </span>
          <span className="pathbar__numbers">
            {overall.done}/{overall.total} · {percent}% · {rank.title}
          </span>
        </p>
      </div>

      <StageRail path={path} progress={progress} expanded={expanded} onJump={onJump} />
    </div>
  )
}
