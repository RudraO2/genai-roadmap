/**
 * Demotion, from `CONTEXT.md` section 6:
 *
 *   "Demotion is automatic: no commits in 12 months → greyed out, marked dormant,
 *    kept visible with its successor linked if one is known. Dead tools are useful
 *    information. Never delete a node."
 *
 * *Automatic* is the load-bearing word, so this is derived from `last_commit`
 * against the current date rather than typed into `nodes.json` by hand. A tool
 * that stops moving goes dormant on the day it earns it, with no registry edit
 * and no session to notice. A registry that states the demotion outright —
 * `status: dormant` or `superseded` — is honoured too, because a project can be
 * abandoned while its last commit is still recent.
 *
 * Pure and total: no React, no clock read at module scope, and no throw on a
 * hand-edited date. `now` is a parameter so the rule can be checked at any point
 * in time instead of only on the day the check runs.
 */

import { DORMANT_AFTER_DAYS } from '../constants.ts'
import type { Node } from '../types.ts'

export interface Dormancy {
  /** Greyed out and marked dormant. `declared || stale`. */
  dormant: boolean
  /** The registry says so outright: `status` is `dormant` or `superseded`. */
  declared: boolean
  /** `last_commit` is more than `DORMANT_AFTER_DAYS` behind `now`. */
  stale: boolean
  /**
   * Whole days since `last_commit`. Null when there is no date to measure —
   * a hosted product with no public repo is not dormant, it is unmeasurable,
   * and the registry already makes it carry a `note` saying which.
   */
  daysSinceCommit: number | null
}

const MS_PER_DAY = 86_400_000

/** Midnight UTC of an ISO `yyyy-mm-dd`, or null when it does not parse. */
function parseDay(value: string | null): number | null {
  if (value === null) return null
  const ms = Date.parse(`${value}T00:00:00Z`)
  return Number.isNaN(ms) ? null : ms
}

export function dormancyOf(node: Node, now: number = Date.now()): Dormancy {
  const declared = node.status === 'dormant' || node.status === 'superseded'
  const committed = parseDay(node.last_commit)

  // A future date (clock skew, or a registry written ahead of itself) floors at
  // 0 rather than reporting negative days.
  const daysSinceCommit =
    committed === null ? null : Math.max(0, Math.floor((now - committed) / MS_PER_DAY))
  const stale = daysSinceCommit !== null && daysSinceCommit > DORMANT_AFTER_DAYS

  return { dormant: declared || stale, declared, stale, daysSinceCommit }
}
