/**
 * Visited storage: which quests the learner has actually opened.
 *
 * Separate from `progress.ts` on purpose, because they answer different
 * questions. "Done" is a claim the learner makes about themselves and exports in
 * a progress file. "Opened" is a fact about this browser — it is what lets the
 * map say *you have already looked at this one* on a return visit, which is the
 * difference between ninety-four boxes and ninety-four boxes you can navigate.
 *
 * It is deliberately not portable: importing someone else's reading history
 * would mark quests you have never seen as seen, which is the one thing this
 * mark must never do.
 *
 * Like every other store here it never throws. Private browsing, a disabled
 * quota or a hand-edited value degrade to "nothing opened yet".
 */

export const VISITED_KEY = 'roadmap:visited:v1'

/** Beyond this the list is trimmed oldest-first. Nobody needs an unbounded log. */
const MAX_VISITED = 400

interface StoredVisited {
  visited: string[]
}

export function loadVisited(): Set<string> {
  let raw: string | null
  try {
    raw = localStorage.getItem(VISITED_KEY)
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
  const { visited } = parsed as Record<string, unknown>
  if (!Array.isArray(visited)) return new Set()

  return new Set(visited.filter((id): id is string => typeof id === 'string'))
}

export function saveVisited(visited: ReadonlySet<string>): void {
  // Insertion order is oldest first, so the slice keeps the most recent.
  const ids = [...visited]
  const payload: StoredVisited = {
    visited: ids.length > MAX_VISITED ? ids.slice(ids.length - MAX_VISITED) : ids,
  }
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable. The session keeps its marks in memory.
  }
}

export function clearVisited(): void {
  try {
    localStorage.removeItem(VISITED_KEY)
  } catch {
    // Same as above.
  }
}
