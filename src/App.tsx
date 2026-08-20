import { useState, type ReactNode } from 'react'

import { Intake } from './components/Intake.tsx'
import { ProgressPanel } from './components/ProgressPanel.tsx'
import { Shell } from './components/Shell.tsx'
import { TrackMap } from './components/TrackMap.tsx'
import type { ImportedProgress } from './data/portability.ts'
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
 *
 * Portability (spec 11) is owned here for the same reason: the panel writes both
 * the completed set and the intake, and this is the only component that holds
 * both. It hangs off both screens, because a learner arriving on a new device
 * should be able to import before choosing a track rather than after.
 */
export default function App(): ReactNode {
  const { intake, setIntake } = useIntake()
  const progress = useProgress()
  const [editing, setEditing] = useState(false)
  const [portabilityOpen, setPortabilityOpen] = useState(false)

  const applyImport = (imported: ImportedProgress): void => {
    progress.replaceProgress(imported.completed)
    // A file without a valid intake still imports its completions; the device
    // keeps the track and level it already had (spec 11 acceptance 4).
    if (imported.intake) {
      setIntake(imported.intake)
      setEditing(false)
    }
  }

  const portabilityControl = (
    <button
      type="button"
      className="progress-open"
      onClick={() => setPortabilityOpen(true)}
      aria-haspopup="dialog"
    >
      Progress file
    </button>
  )

  const panel = (
    <ProgressPanel
      open={portabilityOpen}
      onClose={() => setPortabilityOpen(false)}
      completed={progress.completed}
      intake={intake}
      onImport={applyImport}
      onReset={progress.resetProgress}
    />
  )

  if (!intake || editing) {
    return (
      <ProgressContext.Provider value={progress}>
        <Shell
          masthead={
            <>
              <span className="shell__masthead-meta">
                {registry.nodes.length} NODES / {registry.trackIds.length} TRACKS
              </span>
              {portabilityControl}
            </>
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
          {panel}
        </Shell>
      </ProgressContext.Provider>
    )
  }

  const track = registry.tracks[intake.track]
  // `TrackMap` derives this again for the map itself. `computeTrackProgress` is
  // pure and runs over one track's placed nodes, so the second call is cheaper
  // than lifting the whole derivation past this branch — which cannot hold a
  // hook, and the walker's tween is one.
  const { done, total, frontier } = computeTrackProgress(track, progress.completed)
  // Same "shipped" condition `TrackMap` derives for the Overview banner (spec
  // 14), read here off the same numbers this chip already prints so the two can
  // never disagree.
  const shipped = total > 0 && done === total

  return (
    <ProgressContext.Provider value={progress}>
      <Shell
        masthead={
          <>
            {/* Three flex items in the masthead's existing space-between row, so
                the count needs no new class and no new rule. */}
            <span
              className="shell__masthead-meta"
              data-shipped={shipped ? 'true' : undefined}
            >
              {done} / {total} DONE
              {/* The frontier is counted beside the road, never into it: a spur
                  is optional, so folding it in would make the road's progress
                  depend on side trips (spec 09). */}
              {frontier.total > 0 ? ` · ${frontier.done} / ${frontier.total} FRONTIER` : null}
            </span>
            {portabilityControl}
            <button type="button" className="intake-change" onClick={() => setEditing(true)}>
              Change track / level
            </button>
          </>
        }
      >
        <TrackMap track={track} level={intake.level} />
        {panel}
      </Shell>
    </ProgressContext.Provider>
  )
}
