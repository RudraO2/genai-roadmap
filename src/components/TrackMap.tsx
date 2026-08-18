import { useMemo, type ReactNode } from 'react'

import { useProgressContext } from '../data/ProgressContext.ts'
import {
  computeTrackProgress,
  EMPTY_ACT_PROGRESS,
  type CharacterPlacement,
} from '../data/progress.ts'
import { useTweenedT } from '../hooks/useTweenedT.ts'
import type { Level, Track } from '../types.ts'
import { ActPath } from './ActPath.tsx'
import { Section } from './Section.tsx'

export type { CharacterPlacement }

export interface TrackMapProps {
  track: Track
  level: Level
  /**
   * Which act hosts the walker, and where on it. Defaults to the learner's
   * progress frontier — the first act holding an unfinished node, at that act's
   * revealed position. Pass this to override that, as spec 07 did before there
   * was any progress to read.
   */
  character?: CharacterPlacement
}

/**
 * One Section per act, in `track.acts` order. Branches (frontier) are spec 09.
 * Exactly one act renders a `Character` — every other gets `characterT` null.
 *
 * Progress is derived here, once, by `computeTrackProgress`, and handed down as
 * each act's slice. No component counts completions of its own, so the fog, the
 * dots, the cards and the walker cannot drift apart.
 *
 * The walker's `t` is tweened rather than assigned: the figure walks to the new
 * frontier when a node is marked done. That is also what starts its bob —
 * `useWalking` watches `t` for changes and needs no flag from here.
 */
export function TrackMap({ track, level, character }: TrackMapProps): ReactNode {
  const { completed } = useProgressContext()
  const progress = useMemo(() => computeTrackProgress(track, completed), [track, completed])

  const target = character ?? progress.placement
  const walkerT = useTweenedT(target?.t ?? 0, `${track.id}:${target?.actId ?? 'none'}`)

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
            progress={progress.acts.get(act.id) ?? EMPTY_ACT_PROGRESS}
            characterT={target && target.actId === act.id ? walkerT : null}
          />
        </Section>
      ))}
    </>
  )
}
