/**
 * Progress: which nodes the learner has finished, and everything the map draws
 * from that. Two halves, both free of React.
 *
 * Storage mirrors `intake.ts` — it never throws, because private browsing, a
 * disabled quota or a hand-edited value must degrade to "nothing done yet"
 * rather than take the app down.
 *
 * Derivation is one pure function. The fog, the completed stroke, the dots and
 * the walker all read its output; nothing counts completions a second time.
 *
 * Progress is a flat set of node ids, not a per-track record. The registry is
 * one flat node list shared across tracks (CONTEXT.md section 4), so a node
 * finished on one track is finished on every track that places it. A
 * track-scoped store would let the same node hold two truths.
 */

import type { Act, Branch, Track } from '../types.ts'

export const PROGRESS_KEY = 'roadmap:progress:v1'

interface StoredProgress {
  completed: string[]
}

export function loadCompleted(): Set<string> {
  let raw: string | null
  try {
    raw = localStorage.getItem(PROGRESS_KEY)
  } catch {
    return new Set()
  }
  if (!raw) return new Set()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return new Set()
  }

  if (typeof parsed !== 'object' || parsed === null) return new Set()
  const { completed } = parsed as Record<string, unknown>
  if (!Array.isArray(completed)) return new Set()

  // Unknown ids are kept, not filtered against the registry: a node placed on
  // another track, or one a later registry revision restores, must survive a
  // visit made before it was rendered. CONTEXT.md section 6 never deletes a
  // node, so an id here is worth keeping even when nothing displays it.
  return new Set(completed.filter((id): id is string => typeof id === 'string'))
}

export function saveCompleted(completed: ReadonlySet<string>): void {
  const payload: StoredProgress = { completed: [...completed] }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable. The session keeps working in memory; the next visit
    // simply starts empty. Nothing to recover and nothing to report.
  }
}

export function clearCompleted(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY)
  } catch {
    // Same as above.
  }
}

/**
 * How one dot is drawn. `current` is the learner's position on the *track* —
 * the first unfinished node of the first act that still has one — so exactly
 * one dot carries it. Scoping it per act instead lit the first dot of every
 * act the learner had not reached, which reads as seven "you are here"s.
 */
export type NodeProgressState = 'complete' | 'current' | 'ahead'

export interface ActProgress {
  /**
   * 0-1. Drawn as reached. `1` for an act with nothing left in it, the first
   * incomplete node's `t` for the act the learner is standing in, and level
   * with `completeT` for any act beyond that — an act not yet reached must not
   * stub a trail out to its own first node.
   */
  revealT: number
  /** 0-1. Drawn as done: the completed run from the act's own start. */
  completeT: number
  states: ReadonlyMap<string, NodeProgressState>
  done: number
  total: number
  /**
   * Ids of this act's placed nodes that a branch spurs off (spec 09). Derived
   * here so `ActPath` can mark the anchor dot without walking `track.branches`
   * itself — one pass over the track, one place that decides.
   */
  anchors: ReadonlySet<string>
}

/**
 * One frontier branch's slice. Never carries `current`: exactly one dot on a
 * track is the learner's position and it belongs on the main road. A branch is
 * a side trip, so its states are `complete` or `ahead` only.
 */
export interface BranchProgress {
  states: ReadonlyMap<string, NodeProgressState>
  done: number
  total: number
}

export interface CharacterPlacement {
  actId: string
  t: number
}

export interface TrackProgress {
  acts: ReadonlyMap<string, ActProgress>
  /** Keyed by `branch.id` (spec 09). */
  branches: ReadonlyMap<string, BranchProgress>
  /**
   * Where the walker belongs: the first act holding an incomplete node, at that
   * act's `revealT`. Null only when the track places no nodes at all.
   */
  placement: CharacterPlacement | null
  done: number
  total: number
  /**
   * The branches' totals for the whole track. Deliberately separate from
   * `done` / `total`: a branch is off the main path, so folding it in would make
   * the road's progress depend on optional side trips.
   */
  frontier: { done: number; total: number }
}

/** An act with no placed nodes. Exported so no caller branches on `undefined`. */
export const EMPTY_ACT_PROGRESS: ActProgress = Object.freeze({
  revealT: 0,
  completeT: 0,
  states: new Map<string, NodeProgressState>(),
  done: 0,
  total: 0,
  anchors: new Set<string>(),
})

/** A branch with no placed nodes. Same contract as `EMPTY_ACT_PROGRESS`. */
export const EMPTY_BRANCH_PROGRESS: BranchProgress = Object.freeze({
  states: new Map<string, NodeProgressState>(),
  done: 0,
  total: 0,
})

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)

interface ActResult {
  progress: ActProgress
  /** Index of the first node not yet complete, or -1 when the act is finished. */
  firstIncomplete: number
}

/**
 * @param isFrontierAct True only for the first act on the track that still has
 *   an unfinished node. It is the one act that marks a `current` node and the
 *   one act whose trail runs ahead of its finished stretch.
 */
function computeActProgress(
  act: Act,
  completed: ReadonlySet<string>,
  isFrontierAct: boolean,
  anchorIds: ReadonlySet<string>,
): ActResult {
  if (act.nodes.length === 0) return { progress: EMPTY_ACT_PROGRESS, firstIncomplete: -1 }

  const states = new Map<string, NodeProgressState>()
  const anchors = new Set<string>()
  let firstIncomplete = -1
  let done = 0

  for (const [index, placed] of act.nodes.entries()) {
    const isComplete = completed.has(placed.id)
    if (isComplete) done += 1
    if (!isComplete && firstIncomplete === -1) firstIncomplete = index
    states.set(placed.id, isComplete ? 'complete' : 'ahead')
    if (anchorIds.has(placed.id)) anchors.add(placed.id)
  }

  if (firstIncomplete !== -1 && isFrontierAct) {
    states.set(act.nodes[firstIncomplete]!.id, 'current')
  }

  // The completed prefix, not the completed count: marking node 4 done before
  // node 1 lights node 4's dot but must not draw the line past node 1.
  let completeT = 0
  if (firstIncomplete === -1) {
    completeT = 1
  } else {
    for (let i = 0; i < firstIncomplete; i += 1) {
      completeT = Math.max(completeT, clamp01(act.nodes[i]!.t))
    }
  }

  let revealT = completeT
  if (firstIncomplete === -1) revealT = 1
  else if (isFrontierAct) revealT = Math.max(completeT, clamp01(act.nodes[firstIncomplete]!.t))

  return {
    progress: { revealT, completeT, states, done, total: act.nodes.length, anchors },
    firstIncomplete,
  }
}

/**
 * A branch's slice. No fog geometry and no `current`: a branch draws its whole
 * path at once, marked unproven, and its nodes are optional side trips rather
 * than positions on the road.
 */
function computeBranchProgress(
  branch: Branch,
  completed: ReadonlySet<string>,
): BranchProgress {
  if (branch.nodes.length === 0) return EMPTY_BRANCH_PROGRESS

  const states = new Map<string, NodeProgressState>()
  let done = 0
  for (const placed of branch.nodes) {
    const isComplete = completed.has(placed.id)
    if (isComplete) done += 1
    states.set(placed.id, isComplete ? 'complete' : 'ahead')
  }

  return { states, done, total: branch.nodes.length }
}

/**
 * Everything the map needs to draw progress for one track, derived from the set
 * of completed node ids.
 *
 * Branch (frontier) nodes are derived here too (spec 09) but kept in their own
 * slices: they sit on a different path, so they take no part in an act's fog
 * geometry, none in the walker's frontier, and none in `done` / `total`. Their
 * tally is `frontier`, reported separately and never folded in.
 */
export function computeTrackProgress(
  track: Track,
  completed: ReadonlySet<string>,
): TrackProgress {
  const acts = new Map<string, ActProgress>()
  const branches = new Map<string, BranchProgress>()
  let placement: CharacterPlacement | null = null
  let lastActWithNodes: CharacterPlacement | null = null
  let done = 0
  let total = 0
  let frontierDone = 0
  let frontierTotal = 0

  // Keyed by the anchor's own id rather than by `branch.act`, so the ring lands
  // on the node a branch actually spurs off even if the data ever names an act
  // that does not hold it.
  const anchorIds = new Set(track.branches.map((branch) => branch.anchor))

  for (const branch of track.branches) {
    const progress = computeBranchProgress(branch, completed)
    branches.set(branch.id, progress)
    frontierDone += progress.done
    frontierTotal += progress.total
  }

  for (const act of track.acts) {
    // The frontier act is the first one still holding an unfinished node, and
    // it is decided before its slice is computed because two of that slice's
    // fields depend on it.
    const isFrontierAct =
      placement === null && act.nodes.some((placed) => !completed.has(placed.id))
    const { progress, firstIncomplete } = computeActProgress(
      act,
      completed,
      isFrontierAct,
      anchorIds,
    )
    acts.set(act.id, progress)
    done += progress.done
    total += progress.total

    if (progress.total === 0) continue
    lastActWithNodes = { actId: act.id, t: 1 }
    if (firstIncomplete !== -1 && isFrontierAct) {
      placement = { actId: act.id, t: progress.revealT }
    }
  }

  return {
    acts,
    branches,
    placement: placement ?? lastActWithNodes,
    done,
    total,
    frontier: { done: frontierDone, total: frontierTotal },
  }
}
