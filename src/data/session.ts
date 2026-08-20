/**
 * "I have twenty minutes. What can I actually finish?"
 *
 * The map answers *what to learn* and the banner answers *what is next*. Neither
 * of them answers the question a person actually has when they open this thing on
 * a Tuesday evening, and the mismatch has a cost: when the next quest is a
 * one-week capstone and the learner has half an hour, the banner tells them to
 * start the capstone, and they close the tab. A roadmap that is only usable in
 * hour-long blocks is a roadmap people use twice.
 *
 * So: given a time budget, plan a session. The result is an ordered run of quests
 * that fit inside it, and it is a *plan* rather than a filter because it accounts
 * for its own unlocks — finishing the first quest can make a second one ready,
 * and if that one fits in what is left of the budget it goes in too.
 *
 * The order is the path's own walking order, which is already topologically
 * sound, so a plan can never suggest something before its prerequisites. Core
 * work outranks side quests for the same reason the banner prefers it: a side
 * quest is by definition skippable, and an evening spent on skippable work is an
 * evening that did not move you.
 *
 * Pure, and deliberately free of the registry: it takes the nodes it is planning
 * over. That is what lets it be tested against a handful of hand-built nodes
 * rather than against ninety-four real ones.
 */

import type { RoadmapNode } from '../types.ts'
import { estimateHours, ONGOING } from './duration.ts'

export interface SessionBudget {
  id: string
  /** What the button says. */
  label: string
  /** What it means, in the same study hours `duration.ts` counts. */
  hours: number
}

/**
 * The four offers. Deliberately few and deliberately vague — "a day" is a truer
 * unit for this than "6.0 hours", and a learner who wants to be precise can read
 * the estimate on every card.
 *
 * The smallest one is half an hour rather than twenty minutes because the
 * shortest quest in the registry is 30m: a twenty-minute budget could never
 * return anything, on any path, ever. A test asserting that every budget offers
 * something from a standing start is what caught it.
 */
export const SESSION_BUDGETS: readonly SessionBudget[] = [
  { id: 'coffee', label: 'half an hour', hours: 0.5 },
  { id: 'evening', label: 'an evening', hours: 2 },
  { id: 'day', label: 'a day', hours: 6 },
  { id: 'weekend', label: 'a weekend', hours: 12 },
]

export interface SessionPlan {
  /** The run, in the order to do it. Empty when nothing fits. */
  quests: readonly RoadmapNode[]
  /** What the run adds up to. Never more than `budget`. */
  hours: number
  budget: number
  /**
   * The quest that is next but does not fit, when there is one. This is what
   * turns an empty plan from a shrug into an answer: *nothing fits in twenty
   * minutes; the next thing is Build the whole RAG loop, and it is a week.*
   */
  tooBig: RoadmapNode | null
}

/** Ready means every prerequisite is in the set — the same rule `state.ts` uses. */
function isReady(node: RoadmapNode, done: ReadonlySet<string>): boolean {
  return !done.has(node.id) && node.requires.every((id) => done.has(id))
}

/**
 * A quest can only be planned if it can be finished. `ongoing` is a habit rather
 * than a task: it costs zero hours, so without this it would fit every budget and
 * fill every plan with things that never complete.
 */
function isPlannable(node: RoadmapNode): boolean {
  return node.est !== ONGOING
}

export function planSession(
  ordered: readonly RoadmapNode[],
  completed: ReadonlySet<string>,
  budget: number,
): SessionPlan {
  const done = new Set(completed)
  const quests: RoadmapNode[] = []
  let remaining = budget
  let tooBig: RoadmapNode | null = null

  // Each pass takes at most one quest, then re-derives readiness against a set
  // that now includes it. Bounded by the node count, because every pass either
  // adds a node or stops.
  for (let pass = 0; pass < ordered.length; pass += 1) {
    let pick: RoadmapNode | null = null

    for (const node of ordered) {
      if (!isReady(node, done) || !isPlannable(node)) continue
      const hours = estimateHours(node.est)
      if (hours > remaining) {
        // The first thing that is next but does not fit, recorded once so the
        // empty case has something honest to say.
        if (tooBig === null && node.type !== 'side') tooBig = node
        continue
      }
      // Core work wins outright and ends the search. A side quest is only
      // taken if nothing else in the whole walking order fits, and then it is
      // the *first* such one — hence the guard, without which a later side
      // quest would displace an earlier one.
      if (node.type !== 'side') {
        pick = node
        break
      }
      if (pick === null) pick = node
    }

    if (pick === null) break
    quests.push(pick)
    done.add(pick.id)
    remaining -= estimateHours(pick.est)
  }

  return { quests, hours: budget - remaining, budget, tooBig }
}
