import type { ReactNode } from 'react'

import type { Level, Track } from '../types.ts'
import { ActPath } from './ActPath.tsx'
import { Section } from './Section.tsx'

export interface CharacterPlacement {
  actId: string
  t: number
}

export interface TrackMapProps {
  track: Track
  level: Level
  /**
   * Which act hosts the walker, and where on it. Defaults to the start of the
   * first act; spec 08 passes the learner's progress frontier instead.
   */
  character?: CharacterPlacement
}

/**
 * One Section per act, in `track.acts` order. Branches (frontier) are spec 09.
 * Exactly one act renders a `Character` — every other gets `characterT` null.
 */
export function TrackMap({ track, level, character }: TrackMapProps): ReactNode {
  const placement = character ?? (track.acts[0] ? { actId: track.acts[0].id, t: 0 } : null)

  return (
    <>
      {track.acts.map((act, index) => (
        <Section
          key={act.id}
          index={String(index + 1).padStart(2, '0')}
          kicker={track.title}
          title={act.title}
          standfirst={act.subtitle}
        >
          <ActPath
            act={act}
            level={level}
            characterT={placement && placement.actId === act.id ? placement.t : null}
          />
        </Section>
      ))}
    </>
  )
}
