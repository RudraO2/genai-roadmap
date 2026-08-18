import type { ReactNode } from 'react'

import { padIndex, type ActRef } from '../data/navigation.ts'

export interface ActPagerProps {
  prev: ActRef | null
  next: ActRef | null
  onSelectAct: (actId: string) => void
}

/**
 * The foot of an act: the act before and the act after, by name.
 *
 * Named rather than "Previous" / "Next" because the destination is the useful
 * half — a learner deciding whether to walk on is deciding about "Tools", not
 * about a direction. The arrows are typographic (`←` / `→`), not icons, and
 * certainly not emoji (`CONTEXT.md` section 8).
 *
 * A missing neighbour renders nothing at all rather than a disabled button: on
 * the first and last act there is no such act, and a greyed control that can
 * never do anything is noise. When both are missing — a one-act track — the
 * pager does not render, which `TrackMap` decides so the hairline above it goes
 * too.
 */
export function ActPager({ prev, next, onSelectAct }: ActPagerProps): ReactNode {
  return (
    <nav className="act-pager" aria-label="Acts">
      {prev ? (
        <button
          type="button"
          className="act-pager__step act-pager__step--prev"
          onClick={() => onSelectAct(prev.actId)}
        >
          <span className="act-pager__direction">← Previous</span>
          <span className="act-pager__act">
            {padIndex(prev.index)} {prev.title}
          </span>
        </button>
      ) : null}
      {next ? (
        <button
          type="button"
          className="act-pager__step act-pager__step--next"
          onClick={() => onSelectAct(next.actId)}
        >
          <span className="act-pager__direction">Next →</span>
          <span className="act-pager__act">
            {padIndex(next.index)} {next.title}
          </span>
        </button>
      ) : null}
    </nav>
  )
}
