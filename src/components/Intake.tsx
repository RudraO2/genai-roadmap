import { useState, type FormEvent, type ReactNode } from 'react'

import { LEVELS } from '../constants.ts'
import type { IntakeState } from '../data/intake.ts'
import { registry } from '../data/registry.ts'
import type { Level, TrackId } from '../types.ts'
import { Section } from './Section.tsx'

export interface IntakeProps {
  initialTrack?: TrackId | undefined
  initialLevel?: Level | undefined
  onComplete: (state: IntakeState) => void
}

const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const LEVEL_HINT: Readonly<Record<Level, string>> = {
  beginner: 'New to this. Nothing collapsed.',
  intermediate: 'Comfortable with the basics already.',
  advanced: 'Only the unfamiliar and the frontier.',
}

/** Track and level picker. Both lists render together; there is no wizard step. */
export function Intake({ initialTrack, initialLevel, onComplete }: IntakeProps): ReactNode {
  const [track, setTrack] = useState<TrackId | null>(initialTrack ?? null)
  const [level, setLevel] = useState<Level | null>(initialLevel ?? null)

  const canSubmit = track !== null && level !== null

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    if (!canSubmit) return
    onComplete({ track, level })
  }

  return (
    <form className="intake" onSubmit={handleSubmit}>
      <Section
        index="01"
        kicker="Interactive Roadmap"
        title="Pick a track"
        standfirst="Four ways to ship something real. Nodes are shared freely across all of them."
      >
        <ul className="track-list">
          {registry.trackIds.map((id, i) => {
            const meta = registry.tracks[id]
            const nodeCount = registry.orderedNodeIds(id).length
            const actCount = registry.actsForTrack(id).length
            const selected = track === id
            // `data-track` carries the track's own id so shell.css can print each
            // one on its own paper. Colour by list position is banned by name in
            // CONTEXT.md section 8; colour by identity is the point.
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`track-row${selected ? ' track-row--selected' : ''}`}
                  data-track={id}
                  aria-pressed={selected}
                  onClick={() => setTrack(id)}
                >
                  <span className="track-row__id">{String(i + 1).padStart(2, '0')}</span>
                  <span className="track-row__title">{meta.title}</span>
                  <span className="track-row__destination">{meta.destination}</span>
                  <span className="track-row__meta">
                    {nodeCount} nodes / {actCount} acts
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section
        index="02"
        kicker="Starting point"
        title="Choose your level"
        standfirst="Nodes below this collapse to a single line — never deleted, always expandable."
      >
        <ul className="level-list">
          {LEVELS.map((id) => {
            const selected = level === id
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`level-row${selected ? ' level-row--selected' : ''}`}
                  data-level={id}
                  aria-pressed={selected}
                  onClick={() => setLevel(id)}
                >
                  <span className="level-row__title">{LEVEL_LABEL[id]}</span>
                  <span className="level-row__hint">{LEVEL_HINT[id]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Section>

      <div className="intake__submit">
        <button type="submit" className="intake__continue" disabled={!canSubmit}>
          Continue
        </button>
      </div>
    </form>
  )
}
