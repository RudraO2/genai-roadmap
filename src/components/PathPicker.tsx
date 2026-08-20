import { useState, type FormEvent, type ReactNode } from 'react'

import { LEVELS } from '../constants.ts'
import type { IntakeState } from '../data/intake.ts'
import { registry } from '../data/roadmap.ts'
import type { Level, PathId } from '../types.ts'
import { Section } from './Section.tsx'

export interface PathPickerProps {
  initialPath?: PathId | undefined
  initialLevel?: Level | undefined
  onComplete: (state: IntakeState) => void
}

const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const LEVEL_HINT: Readonly<Record<Level, string>> = {
  beginner: 'New to this. Nothing is assumed and nothing is hidden.',
  intermediate: 'Comfortable with the basics. Earlier quests are marked as review.',
  advanced: 'Here for the hard parts. Beginner quests are dimmed but still open.',
}

/**
 * Path and level picker. Both lists render together; there is no wizard.
 *
 * The level is advice, not a gate. Nothing is ever removed from the map because of
 * it — a roadmap that hides the thing you were curious about has failed at the one
 * job a roadmap has.
 */
export function PathPicker({ initialPath, initialLevel, onComplete }: PathPickerProps): ReactNode {
  const [path, setPath] = useState<PathId | null>(initialPath ?? null)
  const [level, setLevel] = useState<Level | null>(initialLevel ?? null)

  const canSubmit = path !== null && level !== null

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    if (!canSubmit) return
    onComplete({ path, level })
  }

  return (
    <form className="picker" onSubmit={handleSubmit}>
      <Section
        index="01"
        kicker="Choose a path"
        title="Four ways in"
        standfirst="Every path is a graph of quests with real links, real steps, and a finish line. Quests are shared between paths — nothing you do here is wasted if you switch."
      >
        <ul className="path-list">
          {registry.paths.map((meta, index) => {
            const nodes = registry.nodesForPath(meta.id)
            const selected = path === meta.id
            const xp = nodes.reduce((total, node) => total + node.xp, 0)
            return (
              <li key={meta.id}>
                <button
                  type="button"
                  className={`path-card${selected ? ' path-card--selected' : ''}`}
                  data-path={meta.id}
                  aria-pressed={selected}
                  onClick={() => setPath(meta.id)}
                >
                  <span className="path-card__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="path-card__title">{meta.title}</span>
                  <span className="path-card__tagline">{meta.tagline}</span>
                  <span className="path-card__goal">
                    <strong>Finish line.</strong> {meta.goal}
                  </span>
                  <span className="path-card__for">{meta.for}</span>
                  <span className="path-card__meta">
                    {nodes.length} quests / {meta.stages.length} stages / {xp} XP
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
        title="Where are you now?"
        standfirst="This only changes what the map recommends and what it dims. Nothing is ever hidden from you."
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

      <div className="picker__submit">
        <button type="submit" className="picker__continue" disabled={!canSubmit}>
          Open the map
        </button>
      </div>
    </form>
  )
}
