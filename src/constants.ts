/**
 * Runtime companions to `types.ts`: the members of each union in display order,
 * plus the small set of numbers the interface agrees about. Kept out of
 * `types.ts` so that file stays type-only and consumers can `import type` from it.
 */

import type { Level, LinkKind, NodeType, SearchEngine } from './types.ts'

export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced']
export const NODE_TYPES: readonly NodeType[] = ['core', 'side', 'build', 'boss']
export const LINK_KINDS: readonly LinkKind[] = [
  'repo',
  'course',
  'tool',
  'docs',
  'list',
  'playground',
]
export const SEARCH_ENGINES: readonly SearchEngine[] = ['google', 'youtube', 'github']

/** Rank used to compare levels. The picker uses it to dim what is above you. */
export const LEVEL_RANK: Readonly<Record<Level, number>> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

export const TYPE_LABEL: Readonly<Record<NodeType, string>> = {
  core: 'Core',
  side: 'Side quest',
  build: 'Build',
  boss: 'Capstone',
}

/**
 * A search button's destination, built from the query rather than stored as a URL.
 * A constructed search URL always resolves — which is why every node carries one,
 * and why a dead-link report can never apply to this half of the interface.
 */
export const SEARCH_URL: Readonly<Record<SearchEngine, (q: string) => string>> = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  youtube: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  github: (q) => `https://github.com/search?type=repositories&q=${encodeURIComponent(q)}`,
}

export const SEARCH_LABEL: Readonly<Record<SearchEngine, string>> = {
  google: 'Google',
  youtube: 'YouTube',
  github: 'GitHub',
}

/**
 * Rank names, as a fraction of the XP available on the learner's own path. Relative
 * rather than absolute because the four paths differ in size by a factor of two,
 * and "you are a third of the way through your own path" is the honest reading.
 */
export const RANKS: readonly { at: number; title: string }[] = [
  { at: 0, title: 'Curious' },
  { at: 0.1, title: 'Apprentice' },
  { at: 0.3, title: 'Practitioner' },
  { at: 0.55, title: 'Builder' },
  { at: 0.8, title: 'Specialist' },
  { at: 1, title: 'Architect' },
]

/** CONTEXT.md section 7: a blurb is one line. Enforced by the data validator. */
export const MAX_BLURB_LENGTH = 110
