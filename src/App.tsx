import { useState, type ReactNode } from 'react'

import { Intake } from './components/Intake.tsx'
import { Shell } from './components/Shell.tsx'
import { TrackMap } from './components/TrackMap.tsx'
import { registry } from './data/registry.ts'
import { useIntake } from './hooks/useIntake.ts'

/**
 * Root screen. No stored intake: the picker. Stored intake and not editing: the
 * track map (spec 04) for the chosen track, with a "Change" control that
 * reopens the picker pre-filled.
 */
export default function App(): ReactNode {
  const { intake, setIntake } = useIntake()
  const [editing, setEditing] = useState(false)

  if (!intake || editing) {
    return (
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
    )
  }

  const track = registry.tracks[intake.track]

  return (
    <Shell
      masthead={
        <button type="button" className="intake-change" onClick={() => setEditing(true)}>
          Change track / level
        </button>
      }
    >
      <TrackMap track={track} level={intake.level} />
    </Shell>
  )
}
