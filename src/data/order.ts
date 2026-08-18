/**
 * The one definition of the order a learner meets nodes in on a track.
 *
 * Act by act, and within each act its own placed nodes followed by the nodes of
 * every branch anchored in that act. The validator checks prerequisites against
 * this order and the loader hands the same order to the UI. It exists as its own
 * module so those two can never drift apart — a second implementation would let
 * the map disagree with its own validation.
 */

import type { Track } from '../types.ts'

export function readingOrder(track: Track): string[] {
  const order: string[] = []
  for (const act of track.acts) {
    for (const placed of act.nodes) order.push(placed.id)
    for (const branch of track.branches) {
      if (branch.act !== act.id) continue
      for (const placed of branch.nodes) order.push(placed.id)
    }
  }
  return order
}
