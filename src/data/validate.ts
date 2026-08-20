/**
 * The registry validator. One implementation, run in two places: at module load in
 * the browser (`roadmap.ts`) and from the command line in `npm run build`
 * (`scripts/validate-data.ts`), so a file that would break the app cannot reach a
 * deploy.
 *
 * Errors block. Warnings are printed and do not.
 *
 * The rules that matter are the graph ones. A roadmap whose edges point at missing
 * nodes, or forward in time, or in a circle, is worse than no roadmap: it will
 * cheerfully tell a beginner to do things in an impossible order.
 */

import { LEVELS, LINK_KINDS, MAX_BLURB_LENGTH, NODE_TYPES, SEARCH_ENGINES } from '../constants.ts'
import type { RoadmapFile, RoadmapNode } from '../types.ts'
import { isEstimate } from './duration.ts'

export type Severity = 'error' | 'warning'

export interface Issue {
  code: string
  severity: Severity
  path: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  issues: Issue[]
  errors: Issue[]
  warnings: Issue[]
}

class Collector {
  readonly issues: Issue[] = []

  error(code: string, path: string, message: string): void {
    this.issues.push({ code, severity: 'error', path, message })
  }

  warn(code: string, path: string, message: string): void {
    this.issues.push({ code, severity: 'warning', path, message })
  }
}

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)

/** Path depth of a URL, used to bound what an unverified link is allowed to be. */
function pathDepth(url: string): number {
  const withoutScheme = url.replace(/^https?:\/\//, '')
  const slash = withoutScheme.indexOf('/')
  if (slash < 0) return 0
  return withoutScheme
    .slice(slash + 1)
    .split(/[?#]/)[0]!
    .split('/')
    .filter((segment) => segment.length > 0).length
}

function checkNode(node: RoadmapNode, at: string, ids: ReadonlySet<string>, c: Collector): void {
  for (const field of ['id', 'title', 'blurb', 'stage', 'est', 'mission', 'why'] as const) {
    if (!isString(node[field])) c.error('BAD_FIELD', `${at}.${field}`, `must be a non-empty string`)
  }

  // `est` is summed into the "time left" figure, so a value that does not parse
  // would not look wrong — it would quietly make that figure too small.
  if (!isEstimate(node.est)) {
    c.error('BAD_EST', `${at}.est`, `"${node.est}" is not <n>m|h|d|w or "ongoing"`)
  }

  if (!LEVELS.includes(node.level)) c.error('BAD_LEVEL', `${at}.level`, `unknown level "${node.level}"`)
  if (!NODE_TYPES.includes(node.type)) c.error('BAD_TYPE', `${at}.type`, `unknown type "${node.type}"`)
  if (!isInt(node.xp) || node.xp <= 0) c.error('BAD_XP', `${at}.xp`, 'xp must be a positive integer')
  if (!isInt(node.col) || node.col < 0) c.error('BAD_COL', `${at}.col`, 'col must be a non-negative integer')
  if (!isInt(node.row) || node.row < 0) c.error('BAD_ROW', `${at}.row`, 'row must be a non-negative integer')

  if (isString(node.blurb) && node.blurb.length > MAX_BLURB_LENGTH) {
    c.warn('LONG_BLURB', `${at}.blurb`, `${node.blurb.length} chars, over ${MAX_BLURB_LENGTH}`)
  }

  if (!isStringArray(node.requires)) {
    c.error('BAD_REQUIRES', `${at}.requires`, 'must be an array of node ids')
  } else {
    for (const id of node.requires) {
      if (!ids.has(id)) c.error('DANGLING_EDGE', `${at}.requires`, `no such node "${id}"`)
      if (id === node.id) c.error('SELF_EDGE', `${at}.requires`, 'a node cannot require itself')
    }
  }

  // A step list is the whole point of a node. Without it this is a bookmark.
  if (!isStringArray(node.steps) || node.steps.length < 2) {
    c.error('NO_STEPS', `${at}.steps`, 'at least two concrete steps are required')
  }
  if (!isStringArray(node.done_when) || node.done_when.length < 1) {
    c.error('NO_DONE_WHEN', `${at}.done_when`, 'at least one observable finish condition is required')
  }
  if (!isStringArray(node.tags)) c.error('BAD_TAGS', `${at}.tags`, 'must be an array of strings')

  if (!Array.isArray(node.links) || node.links.length === 0) {
    c.error('NO_LINKS', `${at}.links`, 'every node must point somewhere')
  } else {
    node.links.forEach((link, i) => {
      const where = `${at}.links[${i}]`
      if (!isString(link.label)) c.error('BAD_FIELD', `${where}.label`, 'must be a non-empty string')
      if (!isString(link.url) || !/^https:\/\//.test(link.url)) {
        c.error('BAD_URL', `${where}.url`, 'must be an https URL')
      }
      if (!LINK_KINDS.includes(link.kind)) c.error('BAD_KIND', `${where}.kind`, `unknown kind "${link.kind}"`)
      if (typeof link.verified !== 'boolean') {
        c.error('BAD_VERIFIED', `${where}.verified`, 'must be a boolean')
      }
      // A link nobody could reach when the registry was written is allowed only as
      // a stable site root. Anything deeper is a guess, and a guessed deep link is
      // exactly the 404 this rule exists to prevent.
      if (link.verified === false && isString(link.url) && pathDepth(link.url) > 2) {
        c.error('UNVERIFIED_DEEP_LINK', `${where}.url`, 'unverified links must be site roots')
      }
      if (link.stars !== undefined && !isInt(link.stars)) {
        c.error('BAD_STARS', `${where}.stars`, 'stars must be an integer when present')
      }
    })
  }

  if (!Array.isArray(node.search) || node.search.length === 0) {
    c.error('NO_SEARCH', `${at}.search`, 'every node needs at least one search query')
  } else {
    node.search.forEach((query, i) => {
      const where = `${at}.search[${i}]`
      if (!SEARCH_ENGINES.includes(query.on)) c.error('BAD_ENGINE', `${where}.on`, `unknown engine "${query.on}"`)
      if (!isString(query.q)) c.error('BAD_FIELD', `${where}.q`, 'must be a non-empty string')
    })
  }
}

/**
 * Depth-first cycle detection over `requires`. A cycle is the one defect that makes
 * the interface unusable rather than merely wrong: every node in the loop is locked
 * forever, and nothing on screen explains why.
 */
function findCycle(nodes: readonly RoadmapNode[]): string[] | null {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const state = new Map<string, 'open' | 'closed'>()
  const stack: string[] = []

  const walk = (id: string): string[] | null => {
    const seen = state.get(id)
    if (seen === 'closed') return null
    if (seen === 'open') return [...stack.slice(stack.indexOf(id)), id]

    state.set(id, 'open')
    stack.push(id)
    for (const next of byId.get(id)?.requires ?? []) {
      if (!byId.has(next)) continue
      const cycle = walk(next)
      if (cycle) return cycle
    }
    stack.pop()
    state.set(id, 'closed')
    return null
  }

  for (const node of nodes) {
    const cycle = walk(node.id)
    if (cycle) return cycle
  }
  return null
}

export function validateRoadmap(raw: unknown): ValidationResult {
  const c = new Collector()
  const finish = (): ValidationResult => {
    const errors = c.issues.filter((i) => i.severity === 'error')
    const warnings = c.issues.filter((i) => i.severity === 'warning')
    return { ok: errors.length === 0, issues: c.issues, errors, warnings }
  }

  if (typeof raw !== 'object' || raw === null) {
    c.error('BAD_ROOT', 'roadmap', 'the registry must be an object')
    return finish()
  }

  const file = raw as Partial<RoadmapFile>
  if (!Array.isArray(file.nodes) || !Array.isArray(file.stages) || !Array.isArray(file.paths)) {
    c.error('BAD_ROOT', 'roadmap', 'nodes, stages and paths must all be arrays')
    return finish()
  }

  const stageIds = new Set<string>()
  file.stages.forEach((stage, i) => {
    const at = `stages[${i}]`
    for (const field of ['id', 'title', 'kicker', 'summary'] as const) {
      if (!isString(stage[field])) c.error('BAD_FIELD', `${at}.${field}`, 'must be a non-empty string')
    }
    if (stageIds.has(stage.id)) c.error('DUPLICATE_ID', `${at}.id`, `duplicate stage "${stage.id}"`)
    stageIds.add(stage.id)
  })

  const nodeIds = new Set<string>()
  file.nodes.forEach((node, i) => {
    if (nodeIds.has(node.id)) c.error('DUPLICATE_ID', `nodes[${i}].id`, `duplicate node "${node.id}"`)
    nodeIds.add(node.id)
  })

  file.nodes.forEach((node, i) => {
    const at = `nodes[${i}]`
    checkNode(node, at, nodeIds, c)
    if (!stageIds.has(node.stage)) c.error('UNKNOWN_STAGE', `${at}.stage`, `no such stage "${node.stage}"`)
  })

  // Two nodes in one cell would draw on top of each other, and the one underneath
  // would be unclickable — a defect nobody would ever report as a data problem.
  const cells = new Set<string>()
  file.nodes.forEach((node, i) => {
    const cell = `${node.stage}:${node.col}:${node.row}`
    if (cells.has(cell)) c.error('GRID_COLLISION', `nodes[${i}]`, `two nodes share cell ${cell}`)
    cells.add(cell)
  })

  const cycle = findCycle(file.nodes)
  if (cycle) c.error('CYCLE', 'nodes.requires', `prerequisite cycle: ${cycle.join(' -> ')}`)

  const allNodes = file.nodes
  const byId = new Map(allNodes.map((n) => [n.id, n]))
  const pathIds = new Set<string>()

  file.paths.forEach((path, i) => {
    const at = `paths[${i}]`
    for (const field of ['id', 'title', 'tagline', 'goal'] as const) {
      if (!isString(path[field])) c.error('BAD_FIELD', `${at}.${field}`, 'must be a non-empty string')
    }
    if (pathIds.has(path.id)) c.error('DUPLICATE_ID', `${at}.id`, `duplicate path "${path.id}"`)
    pathIds.add(path.id)

    if (!isStringArray(path.stages) || path.stages.length === 0) {
      c.error('BAD_FIELD', `${at}.stages`, 'a path needs at least one stage')
      return
    }

    const order = new Map(path.stages.map((s, index) => [s, index]))
    for (const stage of path.stages) {
      if (!stageIds.has(stage)) c.error('UNKNOWN_STAGE', `${at}.stages`, `no such stage "${stage}"`)
    }

    // The rule that makes the map trustworthy: on any path you can actually walk,
    // every prerequisite is visible and comes earlier. A node whose prerequisite is
    // off-path would be permanently locked with no way to unlock it.
    for (const node of allNodes) {
      const here = order.get(node.stage)
      if (here === undefined) continue
      for (const id of node.requires) {
        const required = byId.get(id)
        if (!required) continue
        const there = order.get(required.stage)
        if (there === undefined) {
          c.error('OFF_PATH_EDGE', `${at}.stages`, `"${node.id}" requires "${id}", not on this path`)
        } else if (there > here) {
          c.error('BACKWARD_EDGE', `${at}.stages`, `"${node.id}" requires "${id}" from a later stage`)
        } else if (there === here && required.row > node.row) {
          c.error('UPWARD_EDGE', `${at}.stages`, `"${node.id}" requires "${id}" from a lower row`)
        } else if (there === here && required.row === node.row && required.col > node.col) {
          // Same row, prerequisite further right. The map survives this — the
          // edge just runs leftwards — but the reading order does not: the app
          // walks a stage by row, then by column, so the list view prints the
          // locked quest *above* the thing that unlocks it, and a "do this
          // next" that scanned in order would reach the dependent first. Three
          // nodes were sitting like this before the rule existed.
          c.error(
            'LEFTWARD_EDGE',
            `${at}.stages`,
            `"${node.id}" requires "${id}" from further right on the same row`,
          )
        }
      }
    }
  })

  for (const node of allNodes) {
    const onSome = file.paths.some((p) => Array.isArray(p.stages) && p.stages.includes(node.stage))
    if (!onSome) c.warn('ORPHAN_STAGE', `nodes.${node.id}`, `stage "${node.stage}" is on no path`)
  }

  // A side quest that something else depends on is not optional, whatever it says.
  for (const node of allNodes) {
    for (const id of node.requires) {
      if (byId.get(id)?.type === 'side') {
        c.warn('SIDE_PREREQUISITE', `nodes.${node.id}`, `depends on side quest "${id}"`)
      }
    }
  }

  return finish()
}

export function formatIssues(issues: readonly Issue[]): string {
  return issues.map((i) => `${i.severity}  ${i.code}  ${i.path}: ${i.message}`).join('\n')
}
