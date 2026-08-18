import type { ReactNode } from 'react'

import type { Level, Track } from '../types.ts'
import { ActPath } from './ActPath.tsx'
import { Section } from './Section.tsx'

export interface TrackMapProps {
  track: Track
  level: Level
}

/** One Section per act, in `track.acts` order. Branches (frontier) are spec 09. */
export function TrackMap({ track, level }: TrackMapProps): ReactNode {
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
          <ActPath act={act} level={level} />
        </Section>
      ))}
    </>
  )
}
