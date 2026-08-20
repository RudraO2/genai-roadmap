/**
 * Everything the interface derives from one set of completed ids. Pure, React-free,
 * and computed in exactly one place so the graph, the header, the stage bands and
 * the "do this next" banner can never disagree about the same number.
 *
 * The important derivation is `NodeState`. A node is ready when every prerequisite
 * is done — that, and nothing else, is what answers the learner's real question,
 * which is not "what exists" but "what do I do now".
 */

import { RANKS } from '../constants.ts'
import type { LearningPath, NodeState, RoadmapNode, StageId } from '../types.ts'
import { registry } from './roadmap.ts'

export interface Tally {
  done: number
  total: number
  xp: number
  xpTotal: number
}

export interface Rank {
  title: string
  /** The next rank up, or null at the top. Drawn as the thing still to earn. */
  next: { title: string; atPercent: number } | null
}

export interface PathProgress {
  states: ReadonlyMap<string, NodeState>
  /** Ordered ids, stage by stage — the order the recommendation walks. */
  order: readonly string[]
  overall: Tally
  stages: ReadonlyMap<StageId, Tally>
  percent: number
  rank: Rank
  /** How many nodes are unlocked and unfinished right now. */
  readyCount: number
  /** The single node the banner tells the learner to do next, or null when done. */
  next: RoadmapNode | null
}

const EMPTY_TALLY: Tally = { done: 0, total: 0, xp: 0, xpTotal: 0 }

function rankFor(percent: number): Rank {
  let current = RANKS[0]!
  let next: Rank['next'] = null
  for (const rank of RANKS) {
    if (percent >= rank.at * 100) current = rank
    else {
      next = { title: rank.title, atPercent: Math.round(rank.at * 100) }
      break
    }
  }
  return { title: current.title, next }
}

/**
 * Which prerequisites are still outstanding. Returned as nodes rather than ids so
 * the panel can name them and link to them — "finish Tool calling first" is useful,
 * "requires tool-calling" is a database row.
 */
export function blockedBy(node: RoadmapNode, completed: ReadonlySet<string>): RoadmapNode[] {
  return node.requires.filter((id) => !completed.has(id)).map((id) => registry.getNode(id))
}

export function stateOf(node: RoadmapNode, completed: ReadonlySet<string>): NodeState {
  if (completed.has(node.id)) return 'done'
  return node.requires.every((id) => completed.has(id)) ? 'ready' : 'locked'
}

export function computePathProgress(
  path: LearningPath,
  completed: ReadonlySet<string>,
): PathProgress {
  const nodes = registry.nodesForPath(path.id)
  const states = new Map<string, NodeState>()
  const stages = new Map<StageId, Tally>()

  let done = 0
  let xp = 0
  let xpTotal = 0
  let readyCount = 0

  for (const node of nodes) {
    const state = stateOf(node, completed)
    states.set(node.id, state)

    const tally = stages.get(node.stage) ?? { done: 0, total: 0, xp: 0, xpTotal: 0 }
    tally.total += 1
    tally.xpTotal += node.xp
    xpTotal += node.xp
    if (state === 'done') {
      tally.done += 1
      tally.xp += node.xp
      done += 1
      xp += node.xp
    }
    if (state === 'ready') readyCount += 1
    stages.set(node.stage, tally)
  }

  // Percentage is XP, not node count: a capstone worth a week should not be worth
  // the same sliver of the bar as a forty-minute read.
  const percent = xpTotal === 0 ? 0 : Math.round((xp / xpTotal) * 100)

  // The recommendation. Walking order first, so it always points forwards; core
  // work ahead of side quests, because a side quest is by definition skippable and
  // a banner that pushes one is giving bad advice.
  const open = nodes.filter((node) => states.get(node.id) === 'ready')
  const next = open.find((node) => node.type !== 'side') ?? open[0] ?? null

  return {
    states,
    order: nodes.map((node) => node.id),
    overall: { done, total: nodes.length, xp, xpTotal },
    stages,
    percent,
    rank: rankFor(percent),
    readyCount,
    next,
  }
}

export function tallyFor(progress: PathProgress, stage: StageId): Tally {
  return progress.stages.get(stage) ?? EMPTY_TALLY
}
