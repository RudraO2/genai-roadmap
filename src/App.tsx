import { useState, type ReactNode } from 'react'

import { Intake } from './components/Intake.tsx'
import { Shell } from './components/Shell.tsx'
import { TrackMap } from './components/TrackMap.tsx'
import { computeTrackProgress } from './data/progress.ts'
import { ProgressContext } from './data/ProgressContext.ts'
import { registry } from './data/registry.ts'
import { useIntake } from './hooks/useIntake.ts'
import { useProgress } from './hooks/useProgress.ts'

/**
 * Root screen. No stored intake: the picker. Stored intake and not editing: the
 * track map (spec 04) for the chosen track, with a "Change" control that
 * reopens the picker pre-filled.
 *
 * Progress (spec 08) is owned here, at the one mount point above both branches,
 * and reaches the cards through `ProgressContext`. The provider wraps the picker
 * too — cheap, and it means nothing has to move if a later screen wants to read
 * the same set.
 */
export default function App(): ReactNode {
  const { intake, setIntake } = useIntake()
  const progress = useProgress()
  const [editing, setEditing] = useState(false)

  if (!intake || editing) {
    return (
      <ProgressContext.Provider value={progress}>
        <Shell
          masthead={
            <span className="shell__masthead-meta">
              {registry.nodes.length} NODES / {registry.trackIds.length} TRACKS
            </span>
          }
        >
          <Intake
            initialTrack={intake?.track}
            initialLevel={intake?.level}
            onComplete={(state) => {
              setIntake(state)
              setEditing(false)
            }}
          />
        </Shell>
      </ProgressContext.Provider>
    )
  }

  const track = registry.tracks[intake.track]
  // `TrackMap` derives this again for the map itself. `computeTrackProgress` is
  // pure and runs over one track's placed nodes, so the second call is cheaper
  // than lifting the whole derivation past this branch — which cannot hold a
  // hook, and the walker's tween is one.
  const { done, total } = computeTrackProgress(track, progress.completed)

  return (
    <ProgressContext.Provider value={progress}>
      <Shell
        masthead={
          <>
            {/* Two flex items in the masthead's existing space-between row, so
                the count needs no new class and no new rule. */}
            <span className="shell__masthead-meta">
              {done} / {total} DONE
            </span>
            <button type="button" className="intake-change" onClick={() => setEditing(true)}>
              Change track / level
            </button>
          </>
        }
      >
        <TrackMap track={track} level={intake.level} />
      </Shell>
    </ProgressContext.Provider>
  )
}
