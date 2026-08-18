import type { ReactNode } from 'react'

import { padIndex, type ActRef } from '../data/navigation.ts'

export interface ActNavProps {
  /** 1-based position of the act on screen. */
  index: number
  count: number
  onOverview: () => void
  /**
   * The act the learner is standing in, given only when it is *not* the one on
   * screen. Absent means they are looking at where they are.
   */
  standing: ActRef | null
  onSelectAct: (actId: string) => void
}

/**
 * The strip above an act: the way out to the overview, the act's position on
 * the track, and — only when the learner has navigated away from it — the way
 * back to the act they are standing in.
 *
 * It carries no previous/next. Those live at the foot of the act (`ActPager`),
 * where a reader who has come to the end of one act actually wants them; one
 * control per job keeps the two bars from reading as the same bar twice.
 *
 * The "standing in" control exists because marking the last node of an act done
 * moves the learner's frontier to the next act while the screen deliberately
 * stays put (yanking the view out from under a cursor is worse than a stale
 * one). Without it, the walker would simply be somewhere off screen with
 * nothing pointing at it.
 */
export function ActNav({
  index,
  count,
  onOverview,
  standing,
  onSelectAct,
}: ActNavProps): ReactNode {
  return (
    <nav className="act-nav" aria-label="Map">
      <button type="button" className="act-nav__link" onClick={onOverview}>
        Overview
      </button>
      <p className="act-nav__position">
        Act {padIndex(index)} / {padIndex(count)}
      </p>
      {standing ? (
        <button
          type="button"
          className="act-nav__link act-nav__link--standing"
          onClick={() => onSelectAct(standing.actId)}
        >
          You are in {padIndex(standing.index)} {standing.title}
        </button>
      ) : null}
    </nav>
  )
}
