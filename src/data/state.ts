/**
 * Everything the interface derives from one set of completed ids. Pure, React-free,
 * and computed in exactly one place so the graph, the header, the stage bands and
 * the "do this next" banner can never disagree about the same number.
 *
 * The important derivation is `NodeState`. A node is ready when every prerequisite
 * is done — that, and nothing else, is what answers the learner's real question,
 * which is not "what exists" but "what do I do now".
 */

import { LEVEL_RANK, RANKS } from '../constants.ts'
import type { LearningPath, Level, NodeState, RoadmapNode, StageId } from '../types.ts'
import { estimateHours } from './duration.ts'
import { registry } from './roadmap.ts'

export interface Tally {
  done: number
  total: number
  xp: number
  xpTotal: number
  /** Study hours still on the table in this stage. See `data/duration.ts`. */
  hoursLeft: number
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
  /**
   * Study hours still on the table across the whole path. Deliberately *not*
   * shown on the map: "≈54 weeks left" is true of the Model Builder path and is
   * the single most discouraging sentence this app could open with. It belongs
   * where the number is a decision — the picker, choosing between four paths —
   * and the map shows the current stage's figure instead, which is the one you
   * can act on today. See `Tally.hoursLeft`.
   */
  hoursLeft: number
  /** The single node the banner tells the learner to do next, or null when done. */
  next: RoadmapNode | null
  /**
   * The stage the learner is standing in: the one holding `next`, or the last
   * stage on the path once everything is done. This is the answer to "where am
   * I", and every surface that claims to answer that question reads it here.
   */
  currentStage: StageId | null
}

/**
 * A stage's state, for the stepper and the band headers.
 *   cleared  every quest in it is done
 *   current  it holds the recommended quest — you are here
 *   open     something in it is unlocked and unfinished
 *   ahead    still waiting on work in an earlier stage
 */
export type StageState = 'cleared' | 'current' | 'open' | 'ahead'

const EMPTY_TALLY: Tally = { done: 0, total: 0, xp: 0, xpTotal: 0, hoursLeft: 0 }

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
  let hoursLeft = 0

  for (const node of nodes) {
    const state = stateOf(node, completed)
    states.set(node.id, state)

    const tally = stages.get(node.stage) ?? { done: 0, total: 0, xp: 0, xpTotal: 0, hoursLeft: 0 }
    tally.total += 1
    tally.xpTotal += node.xp
    xpTotal += node.xp
    if (state === 'done') {
      tally.done += 1
      tally.xp += node.xp
      done += 1
      xp += node.xp
    }
    else {
      const hours = estimateHours(node.est)
      hoursLeft += hours
      tally.hoursLeft += hours
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
    overall: { done, total: nodes.length, xp, xpTotal, hoursLeft },
    stages,
    percent,
    rank: rankFor(percent),
    readyCount,
    hoursLeft,
    next,
    currentStage: next?.stage ?? path.stages[path.stages.length - 1] ?? null,
  }
}

export function tallyFor(progress: PathProgress, stage: StageId): Tally {
  return progress.stages.get(stage) ?? EMPTY_TALLY
}

/**
 * Where one stage stands. `current` wins over `cleared` only if the
 * recommendation is genuinely inside it, which it cannot be — `next` is always
 * unfinished — so the two can never both apply and the order below is safe.
 */
export function stageStateFor(progress: PathProgress, stageId: StageId): StageState {
  const tally = tallyFor(progress, stageId)
  if (tally.total > 0 && tally.done === tally.total) return 'cleared'
  if (progress.currentStage === stageId) return 'current'
  for (const node of registry.nodesInStage(stageId)) {
    if (progress.states.get(node.id) === 'ready') return 'open'
  }
  return 'ahead'
}

/**
 * How a quest sits relative to the level the learner told us about.
 *   review   below them — worth a skim rather than a study
 *   match    where they said they were, or one honest step up from it
 *   stretch  two levels above them — flagged, and still completely open
 *
 * The rule is asymmetric on purpose, and the asymmetry is the whole design.
 *
 * Downward, any gap is worth marking: an intermediate learner scanning a path
 * wants to know which quests are the basics, so they can skim and tick them.
 *
 * Upward, one level is not news. Taking someone one level up is what a roadmap
 * *is* — flag that and a beginner opening the AI Engineer path finds forty-one
 * of its fifty-nine quests stamped "stretch", which tells them nothing except
 * that they should probably leave. Two levels up is a real jump and gets said
 * out loud; sixteen advanced quests on that same path do carry the mark, and
 * they are exactly the ones that deserve it.
 *
 * Advice, never a filter. Nothing is removed from the map because of the intake
 * answer, and this is the whole of what that answer is allowed to do.
 */
export type LevelFit = 'review' | 'match' | 'stretch'

export function levelFit(node: RoadmapNode, level: Level): LevelFit {
  const difference = LEVEL_RANK[node.level] - LEVEL_RANK[level]
  if (difference < 0) return 'review'
  if (difference > 1) return 'stretch'
  return 'match'
}
