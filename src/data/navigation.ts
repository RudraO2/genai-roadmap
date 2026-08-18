/**
 * Which screen of the map is showing, and what the controls around it say.
 *
 * `CONTEXT.md` section 9: "Each act is its own serpentine screen; a zoomed-out
 * overview chains the acts." So the map is in one of exactly two states — the
 * overview, or one act — and this file is the whole of that logic, free of
 * React so it can be reasoned about and tested as plain data.
 *
 * Nothing here is stored. Progress is worth persisting; where the learner
 * happens to be looking is not, and the map opens where they are standing
 * instead (`initialView`), which is a better answer than a restored scroll
 * position and needs no second storage key.
 *
 * Every lookup is total: an act id this track does not hold resolves to the
 * overview rather than to a blank screen, so a view left over from another
 * track can never render nothing.
 */

import type { Act, Track } from '../types.ts'
import type { CharacterPlacement } from './progress.ts'

export type ActView = { kind: 'overview' } | { kind: 'act'; actId: string }

export const OVERVIEW_VIEW: ActView = Object.freeze({ kind: 'overview' })

export function actViewOf(actId: string): ActView {
  return { kind: 'act', actId }
}

/**
 * The two-digit form every act index is shown in — "01", "07". One helper
 * rather than a `padStart` in each of the four places that print one, so a
 * track that ever grows past nine acts changes width in one edit.
 */
export function padIndex(index: number): string {
  return String(index).padStart(2, '0')
}

/**
 * One act flattened for a control: index and title, no `Act`. A button that
 * says "04 Tools" needs those two things and nothing else, and passing the act
 * itself would let a control reach for geometry it has no business drawing.
 */
export interface ActRef {
  actId: string
  /** 1-based, as shown. */
  index: number
  title: string
}

export function actRefAt(track: Track, index: number): ActRef | null {
  const act = track.acts[index]
  if (!act) return null
  return { actId: act.id, index: index + 1, title: act.title }
}

/** -1 when this track does not hold that act. */
export function actIndexOf(track: Track, actId: string): number {
  return track.acts.findIndex((act) => act.id === actId)
}

/** The same by id. Null when this track does not hold that act. */
export function actRefOf(track: Track, actId: string): ActRef | null {
  return actRefAt(track, actIndexOf(track, actId))
}

/**
 * The act a view resolves to, or null for the overview — and null too for an id
 * the track does not hold, which is what makes a stale view fall back rather
 * than fail.
 */
export function resolveAct(track: Track, view: ActView): Act | null {
  if (view.kind === 'overview') return null
  return track.acts.find((act) => act.id === view.actId) ?? null
}

export interface ActNeighbours {
  prev: ActRef | null
  next: ActRef | null
}

/** Both null on a one-act track, and on an id this track does not hold. */
export function neighbourActs(track: Track, actId: string): ActNeighbours {
  const index = actIndexOf(track, actId)
  if (index === -1) return { prev: null, next: null }
  return { prev: actRefAt(track, index - 1), next: actRefAt(track, index + 1) }
}

/**
 * Where the map opens: the act the learner is standing in, else the first act,
 * else the overview when the track has no acts at all.
 *
 * Landing on act 01 every time would put a learner who has finished four acts
 * in front of work they have already done, and make the first thing they do on
 * every visit a scroll. The placement is already derived — `computeTrackProgress`
 * decides it for the walker — so this costs nothing and cannot disagree with
 * where the character is standing.
 */
export function initialView(
  track: Track,
  placement: CharacterPlacement | null,
): ActView {
  if (placement && actIndexOf(track, placement.actId) !== -1) {
    return actViewOf(placement.actId)
  }
  const first = track.acts[0]
  return first ? actViewOf(first.id) : OVERVIEW_VIEW
}
