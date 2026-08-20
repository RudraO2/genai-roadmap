/**
 * The URL, as state. Hash-based, because this is a static site with no server
 * to route real paths — `#/engineer/rag-pipeline` is a URL GitHub Pages will
 * serve without any rewrite rule, and a real path is not.
 *
 * Three shapes, and there will never be a fourth:
 *
 *   #/                        no path chosen — the picker
 *   #/engineer                that path's map
 *   #/engineer/rag-pipeline   that map, with that quest open
 *
 * This is the app's only address space, and it is deliberately about *place*
 * rather than about the learner. Which path you are looking at and which quest
 * is open are things you would send someone; your level, your progress and what
 * you have opened before are not, and they stay in `localStorage` where they
 * cannot leak into a shared link.
 *
 * Parsing validates against the registry rather than trusting the string, so a
 * link to a quest a later revision removed degrades to that path's map instead
 * of throwing, and a hand-typed hash cannot reach a lookup that would.
 */

import type { PathId } from '../types.ts'
import { registry } from './roadmap.ts'

export interface Route {
  /** A path id the registry knows, or null for the picker. */
  path: PathId | null
  /** A quest id the registry knows *and* that sits on `path`, or null. */
  quest: string | null
}

export const EMPTY_ROUTE: Route = { path: null, quest: null }

/** True when this quest is one of the ones `path` actually shows. */
function questIsOnPath(pathId: PathId, questId: string): boolean {
  return registry.nodesForPath(pathId).some((node) => node.id === questId)
}

export function parseRoute(hash: string): Route {
  const segments = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  const [pathId, questId] = segments

  if (pathId === undefined || !registry.isPathId(pathId)) return EMPTY_ROUTE
  if (questId === undefined) return { path: pathId, quest: null }

  // A quest that exists but belongs to another path is not an error and not a
  // redirect to that other path either: the link said which map to read it on.
  if (!registry.nodesById.has(questId) || !questIsOnPath(pathId, questId)) {
    return { path: pathId, quest: null }
  }
  return { path: pathId, quest: questId }
}

export function formatRoute(route: Route): string {
  if (route.path === null) return '#/'
  if (route.quest === null) return `#/${encodeURIComponent(route.path)}`
  return `#/${encodeURIComponent(route.path)}/${encodeURIComponent(route.quest)}`
}

export function readRoute(): Route {
  return parseRoute(window.location.hash)
}
