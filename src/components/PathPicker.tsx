import { useState, type FormEvent, type ReactNode } from 'react'

import { LEVELS } from '../constants.ts'
import type { IntakeState } from '../data/intake.ts'
import { registry } from '../data/roadmap.ts'
import type { Level, PathId } from '../types.ts'

export interface PathPickerProps {
  initialPath?: PathId | undefined
  initialLevel?: Level | undefined
  onComplete: (state: IntakeState) => void
  /** Present only when a map already exists behind this screen. */
  onCancel?: (() => void) | undefined
}

const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const LEVEL_HINT: Readonly<Record<Level, string>> = {
  beginner: 'New to all of this. Nothing is assumed, and the quests that are a genuine jump are flagged.',
  intermediate: 'You have the basics. Anything below your level is marked review, so you can skim and tick it.',
  advanced: 'Here for the hard parts. Everything below you is marked review — still open, never hidden.',
}

/**
 * The whole of onboarding: two questions, one screen, one button.
 *
 * Both questions were already on one page before this, but the page was two
 * full-bleed editorial sections and the only way to leave it was a control at
 * the very bottom that nobody scrolled to. Three things changed, and all three
 * are about the same thing — a first-time visitor should never have to hunt for
 * the way forward:
 *
 *   1. Nothing is display-scale any more. The headline is a line of type, not a
 *      hero, so both questions and the button fit above the fold together.
 *   2. Every path card ends in a pick row — a radio dot and the word "Choose".
 *      The card was always a button; now it looks like one, which is the entire
 *      complaint people had about it.
 *   3. The action bar is sticky and always on screen, and it says what is still
 *      missing rather than sitting there greyed out and silent.
 *
 * The level is advice, not a gate. Nothing is ever removed from the map because
 * of it — a roadmap that hides the thing you were curious about has failed at
 * the one job a roadmap has. What it does do is mark quests as review or stretch
 * relative to you, which is what these hints promise.
 */
export function PathPicker({
  initialPath,
  initialLevel,
  onComplete,
  onCancel,
}: PathPickerProps): ReactNode {
  const [path, setPath] = useState<PathId | null>(initialPath ?? null)
  const [level, setLevel] = useState<Level | null>(initialLevel ?? null)

  const chosen = path === null ? null : registry.getPath(path)
  const canSubmit = path !== null && level !== null

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    if (!canSubmit) return
    onComplete({ path, level })
  }

  // The bar states the one thing left to do, in the order the form asks for it.
  // "Ready" is the only line that names what you picked back to you, because
  // that is the only moment the answer matters more than the question.
  const status = (): string => {
    if (path === null) return 'Pick a path to continue — you can change it later.'
    if (level === null) return `${chosen?.title}. Now pick where you are starting from.`
    const nodes = registry.nodesForPath(path)
    return `${chosen?.title}, ${LEVEL_LABEL[level].toLowerCase()} — ${nodes.length} quests waiting.`
  }

  return (
    <form className="picker" onSubmit={handleSubmit}>
      <header className="picker__head">
        <p className="picker__eyebrow">Two questions, then the map</p>
        <h1 className="picker__headline">Set up your roadmap</h1>
        <p className="picker__standfirst">
          Every path is a graph of quests with real links, real steps and a finish line. Quests are
          shared between paths, so nothing you do here is wasted if you switch.
        </p>
      </header>

      <section className="picker__step" aria-labelledby="step-path">
        <h2 className="picker__step-head" id="step-path">
          <span className="picker__step-index">1</span>
          What do you want to learn?
        </h2>
        <ul className="path-list">
          {registry.paths.map((meta) => {
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
                  <span className="path-card__title">{meta.title}</span>
                  <span className="path-card__tagline">{meta.tagline}</span>
                  <span className="path-card__goal">
                    <strong>Finish line.</strong> {meta.goal}
                  </span>
                  <span className="path-card__meta">
                    {nodes.length} quests / {meta.stages.length} stages / {xp} XP
                  </span>
                  {/* The affordance. A card that only *behaves* like a button
                      gets clicked by the people who already knew; this row is
                      for everyone else. */}
                  <span className="path-card__pick">
                    <span className="path-card__dot" aria-hidden="true" />
                    {selected ? 'Chosen' : 'Choose this path'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="picker__step" aria-labelledby="step-level">
        <h2 className="picker__step-head" id="step-level">
          <span className="picker__step-index">2</span>
          Where are you starting from?
        </h2>
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
                  <span className="level-row__title">
                    <span className="level-row__dot" aria-hidden="true" />
                    {LEVEL_LABEL[id]}
                  </span>
                  <span className="level-row__hint">{LEVEL_HINT[id]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="picker__bar">
        <p className="picker__status" data-ready={canSubmit ? 'true' : undefined}>
          {status()}
        </p>
        <div className="picker__bar-actions">
          {onCancel ? (
            <button type="button" className="picker__cancel" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="picker__continue" disabled={!canSubmit}>
            Open the map
          </button>
        </div>
      </div>
    </form>
  )
}
