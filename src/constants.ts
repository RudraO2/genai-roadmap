/**
 * Runtime companions to `types.ts`: the members of each union, in display order,
 * plus the two numeric facts the constitution fixes. Kept out of `types.ts` so
 * that file stays type-only and consumers can `import type` from it.
 */

import type { CurveId, Kind, Level, Side, Status, TrackId, Zone } from './types.ts'

export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced']
export const ZONES: readonly Zone[] = ['main', 'frontier']
export const STATUSES: readonly Status[] = ['core', 'emerging', 'dormant', 'superseded']
export const TRACK_IDS: readonly TrackId[] = ['game', 'app', 'portfolio', 'media']
export const SIDES: readonly Side[] = ['left', 'right']
export const CURVE_IDS: readonly CurveId[] = ['short', 'medium', 'long']

/** Display order for the grouped link list in the node panel (spec 06). */
export const KINDS: readonly Kind[] = ['repo', 'docs', 'playground', 'article', 'video', 'thread']

/** Rank used to compare levels. Intake hides nodes below the learner's rank. */
export const LEVEL_RANK: Readonly<Record<Level, number>> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

/** CONTEXT.md section 7: a blurb is one line, max 90 characters. */
export const MAX_BLURB_LENGTH = 90

/** Freshness thresholds from CONTEXT.md section 6, in days. */
export const FRONTIER_GRADUATION_MIN_AGE_DAYS = 90
export const FRONTIER_GRADUATION_MAX_COMMIT_AGE_DAYS = 60
export const DORMANT_AFTER_DAYS = 365
