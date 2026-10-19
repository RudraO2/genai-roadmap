import { useMemo, useState, type ReactNode } from 'react'

import { formatHours } from '../data/duration.ts'
import { registry } from '../data/roadmap.ts'
import { planSession, SESSION_BUDGETS } from '../data/session.ts'
import type { PathProgress } from '../data/state.ts'
import type { LearningPath } from '../types.ts'

export interface NextUpProps {
  path: LearningPath
  progress: PathProgress
  completed: ReadonlySet<string>
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}

/**
 * The banner that answers the only question a beginner actually has: what do I do
 * now. It names one quest, states the mission in a sentence, and offers the two
 * things you could want to do with it.
 *
 * Deliberately one recommendation and not a list. A list of six equally-weighted
 * options is how people end up doing none of them.
 *
 * Underneath it is the other half of that question, which this app could not
 * answer until now: *what can I finish in the time I actually have.* One
 * recommendation is the right answer when the next quest is forty minutes and
 * wrong when it is a one-week capstone and the learner has an evening — there,
 * "do this next" means "start something you cannot finish", and the honest reply
 * is a short run of quests that fits. Picking a budget expands one; picking it
 * again folds it away. Nothing is on screen until it is asked for, which is what
 * keeps this from re-inflating the screen the collapse work just shrank.
 */
export function NextUp({ path, progress, completed, onOpen, onToggle }: NextUpProps): ReactNode {
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const node = progress.next
  const { overall } = progress

  const budget = SESSION_BUDGETS.find((candidate) => candidate.id === budgetId) ?? null
  const plan = useMemo(
    () => (budget === null ? null : planSession(registry.nodesForPath(path.id), completed, budget.hours)),
    [budget, path.id, completed],
  )

  if (!node) {
    return (
      <div className="nextup" data-complete="true">
        <p className="nextup__kicker">Look how far you’ve come</p>
        <h2 className="nextup__title">You’ve finished this course.</h2>
        <p className="nextup__mission">
          {overall.total} lessons completed. Take a moment to enjoy that. Your completed lessons carry over when you try another path.
        </p>
        <a className="button button--primary" href="#/courses">Find your next course →</a>
      </div>
    )
  }

  const stage = registry.getStage(node.stage)

  return (
    <div className="nextup">
      <div className="nextup__head">
        <p className="nextup__kicker">{overall.done === 0 ? 'Your first lesson' : 'Your next lesson'} · {stage.title}</p>
        <span className="badge">{node.est} · At your pace</span>
      </div>
      <h2 className="nextup__title">{node.title}</h2>
      <p className="nextup__mission">{node.blurb}</p>
      <div className="nextup__actions">
        <button type="button" className="nextup__open" onClick={() => onOpen(node.id)}>
          {overall.done === 0 ? 'Start this lesson' : 'Continue learning'} <span aria-hidden="true">→</span>
        </button>
        <span className="nextup__meta">A resource, a practical activity, and a clear finish line.</span>
      </div>

      <details className="session"><summary>Have a little time? Plan a study session</summary>
        <p className="session__ask" id="session-ask">
          How long have you got?
        </p>
        <div className="session__budgets" role="group" aria-labelledby="session-ask">
          {SESSION_BUDGETS.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="session__budget"
              aria-pressed={candidate.id === budgetId}
              onClick={() => setBudgetId(candidate.id === budgetId ? null : candidate.id)}
            >
              {candidate.label}
            </button>
          ))}
        </div>

        {plan === null ? null : plan.quests.length === 0 ? (
          <p className="session__empty">
            Nothing on this path finishes in {budget?.label}.
            {plan.tooBig
              ? ` The next thing is ${plan.tooBig.title}, and it needs ${plan.tooBig.est}.`
              : null}
          </p>
        ) : (
          <>
            <p className="session__summary">
              {plan.quests.length} quest{plan.quests.length === 1 ? '' : 's'}, ≈
              {formatHours(plan.hours)}. Do them in this order; the later ones need the earlier
              ones.
            </p>
            <ol className="session__list">
              {plan.quests.map((quest) => (
                <li key={quest.id} className="session__item">
                  <button
                    type="button"
                    className="session__tick"
                    aria-label={`Mark ${quest.title} done`}
                    onClick={() => onToggle(quest.id)}
                  />
                  <button
                    type="button"
                    className="session__open"
                    onClick={() => onOpen(quest.id)}
                  >
                    <span className="session__item-title">{quest.title}</span>
                    <span className="session__item-meta">
                      {quest.est} · {quest.xp} XP
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </details>
    </div>
  )
}
