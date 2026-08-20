/**
 * Progress storage: which nodes the learner has finished. React-free and DOM-free
 * apart from `localStorage`.
 *
 * It never throws. Private browsing, a disabled quota or a hand-edited value must
 * degrade to "nothing done yet" rather than take the app down.
 *
 * Progress is a flat set of node ids, not a per-path record. The registry is one
 * node list shared across paths, so a node finished on one path is finished on
 * every path that shows it. A path-scoped store would let one node hold two
 * truths, and the learner would be right to be annoyed by that.
 */

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

  // Unknown ids are kept rather than filtered against the registry: a node that
  // only appears on another path, or one a later revision reinstates, must survive
  // a visit made while it was not on screen.
  return new Set(completed.filter((id): id is string => typeof id === 'string'))
}

export function saveCompleted(completed: ReadonlySet<string>): void {
  const payload: StoredProgress = { completed: [...completed] }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable. The session keeps working in memory and the next visit
    // starts empty. Nothing to recover and nothing worth reporting.
  }
}

export function clearCompleted(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY)
  } catch {
    // Same as above.
  }
}
