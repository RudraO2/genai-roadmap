import type { ReactNode } from 'react'

import { registry } from '../data/roadmap.ts'
import type { PathProgress } from '../data/state.ts'

export interface NextUpProps {
  progress: PathProgress
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
 */
export function NextUp({ progress, onOpen, onToggle }: NextUpProps): ReactNode {
  const node = progress.next
  const { overall, percent, rank } = progress

  if (!node) {
    return (
      <div className="nextup" data-complete="true">
        <p className="nextup__kicker">Path complete</p>
        <h2 className="nextup__title">Every quest on this path is done.</h2>
        <p className="nextup__mission">
          {overall.xp} XP, {overall.total} quests. Switch paths from the header — the quests you
          have already finished stay finished on the new one.
        </p>
      </div>
    )
  }

  const stage = registry.getStage(node.stage)

  return (
    <div className="nextup">
      <div className="nextup__head">
        <p className="nextup__kicker">Do this next / {stage.title}</p>
        <p className="nextup__rank">
          {rank.title} · {percent}%
          {rank.next ? ` · ${rank.next.title} at ${rank.next.atPercent}%` : null}
        </p>
      </div>
      <h2 className="nextup__title">{node.title}</h2>
      <p className="nextup__mission">{node.mission}</p>
      <div className="nextup__actions">
        <button type="button" className="nextup__open" onClick={() => onOpen(node.id)}>
          Open the quest
        </button>
        <button type="button" className="nextup__done" onClick={() => onToggle(node.id)}>
          Already done this
        </button>
        <span className="nextup__meta">
          {node.est} · {node.xp} XP · {progress.readyCount} quests unlocked
        </span>
      </div>
    </div>
  )
}
