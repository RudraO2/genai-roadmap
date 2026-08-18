import { useState, type ReactNode } from 'react'

import { Intake } from './components/Intake.tsx'
import { Section } from './components/Section.tsx'
import { Shell } from './components/Shell.tsx'
import { registry } from './data/registry.ts'
import { useIntake } from './hooks/useIntake.ts'

/**
 * Root screen. No stored intake: the picker. Stored intake and not editing: a
 * minimal confirmation of the choice, with a "Change" control that reopens the
 * picker pre-filled. Spec 04 replaces the confirmation body with the real map;
 * the branch on `intake` and the "Change" control stay as they are.
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
      <Section
        index="01"
        kicker="Interactive Roadmap"
        title="You're set"
        standfirst={`${track.destination} — ${intake.level} level.`}
      >
        <p>The path for this track and level arrives next.</p>
      </Section>
    </Shell>
  )
}
