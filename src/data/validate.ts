/**
 * The registry validator.
 *
 * Pure and total: it takes two `unknown` values, never throws, imports no JSON, and
 * imports nothing from `registry.ts`. Phase A enforced a set of invariants while
 * generating `data/*.json`; this file re-derives every one of them from the data so
 * a later hand edit cannot break them silently.
 *
 * Issue codes are stable and greppable. Later specs and the build gate match on them.
 */

import {
  CURVE_IDS,
  KINDS,
  LEVELS,
  MAX_BLURB_LENGTH,
  SIDES,
  STATUSES,
  TRACK_IDS,
  ZONES,
} from '../constants.ts'
import type { Act, Branch, Node, PlacedNode, Track, TrackId } from '../types.ts'
import { readingOrder } from './order.ts'

export type Severity = 'error' | 'warning'

export interface Issue {
  /** Stable, greppable, e.g. `DANGLING_REQUIRE`. */
  code: string
  severity: Severity
  /** Where in the data, e.g. `nodes[12].requires[0]`. */
  path: string
  message: string
}

export interface ValidationResult {
  /** False iff at least one issue has severity `error`. */
  ok: boolean
  issues: Issue[]
  errors: Issue[]
  warnings: Issue[]
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDate(value: unknown): boolean {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** Collects issues so no single check has to thread an array through by hand. */
class Report {
  readonly issues: Issue[] = []

  error(code: string, path: string, message: string): void {
    this.issues.push({ code, severity: 'error', path, message })
  }

  warn(code: string, path: string, message: string): void {
    this.issues.push({ code, severity: 'warning', path, message })
  }

  result(): ValidationResult {
    const errors = this.issues.filter((i) => i.severity === 'error')
    const warnings = this.issues.filter((i) => i.severity === 'warning')
    return { ok: errors.length === 0, issues: this.issues, errors, warnings }
  }
}

// ---------------------------------------------------------------------------
// Shape checks. Each returns the value narrowed, or null when it had to give up.
// ---------------------------------------------------------------------------

function checkString(r: Report, value: unknown, path: string, code = 'BAD_NODE_FIELD'): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) {
    r.error(code, path, `expected a non-empty string, got ${describe(value)}`)
    return false
  }
  return true
}

function checkEnum<T extends string>(
  r: Report,
  value: unknown,
  members: readonly T[],
  path: string,
): boolean {
  if (typeof value !== 'string' || !(members as readonly string[]).includes(value)) {
    r.error('BAD_ENUM', path, `expected one of ${members.join(' | ')}, got ${describe(value)}`)
    return false
  }
  return true
}

function describe(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return `an array of ${value.length}`
  if (typeof value === 'string') return JSON.stringify(value)
  return `${typeof value} ${String(value)}`
}

function checkNode(r: Report, raw: unknown, path: string): Node | null {
  if (!isObject(raw)) {
    r.error('BAD_NODE_FIELD', path, `expected an object, got ${describe(raw)}`)
    return null
  }

  let ok = true
  ok = checkString(r, raw['id'], `${path}.id`) && ok
  ok = checkString(r, raw['title'], `${path}.title`) && ok
  ok = checkString(r, raw['blurb'], `${path}.blurb`) && ok
  ok = checkEnum(r, raw['level'], LEVELS, `${path}.level`) && ok
  ok = checkEnum(r, raw['status'], STATUSES, `${path}.status`) && ok
  ok = checkEnum(r, raw['zone'], ZONES, `${path}.zone`) && ok

  if (!Array.isArray(raw['tracks'])) {
    r.error('BAD_NODE_FIELD', `${path}.tracks`, `expected an array, got ${describe(raw['tracks'])}`)
    ok = false
  } else {
    raw['tracks'].forEach((t, i) => {
      if (!checkEnum(r, t, TRACK_IDS, `${path}.tracks[${i}]`)) ok = false
    })
  }

  if (!Array.isArray(raw['requires'])) {
    r.error(
      'BAD_NODE_FIELD',
      `${path}.requires`,
      `expected an array, got ${describe(raw['requires'])}`,
    )
    ok = false
  } else {
    raw['requires'].forEach((req, i) => {
      if (!checkString(r, req, `${path}.requires[${i}]`)) ok = false
    })
  }

  if (!Array.isArray(raw['links'])) {
    r.error('BAD_NODE_FIELD', `${path}.links`, `expected an array, got ${describe(raw['links'])}`)
    ok = false
  } else {
    raw['links'].forEach((link, i) => {
      const lp = `${path}.links[${i}]`
      if (!isObject(link)) {
        r.error('BAD_NODE_FIELD', lp, `expected an object, got ${describe(link)}`)
        ok = false
        return
      }
      if (!checkString(r, link['label'], `${lp}.label`)) ok = false
      if (!checkEnum(r, link['kind'], KINDS, `${lp}.kind`)) ok = false
      if (!isHttpUrl(link['url'])) {
        r.error('BAD_URL', `${lp}.url`, `expected an http(s) URL, got ${describe(link['url'])}`)
        ok = false
      }
    })
  }

  if (raw['repo'] !== null && typeof raw['repo'] !== 'string') {
    r.error('BAD_NODE_FIELD', `${path}.repo`, `expected a string or null, got ${describe(raw['repo'])}`)
    ok = false
  }
  if (raw['stars'] !== null && !(typeof raw['stars'] === 'number' && Number.isFinite(raw['stars']))) {
    r.error(
      'BAD_NODE_FIELD',
      `${path}.stars`,
      `expected a finite number or null, got ${describe(raw['stars'])}`,
    )
    ok = false
  }
  if (raw['note'] !== undefined && typeof raw['note'] !== 'string') {
    r.error('BAD_NODE_FIELD', `${path}.note`, `expected a string when present, got ${describe(raw['note'])}`)
    ok = false
  }

  if (raw['last_commit'] !== null && !isDate(raw['last_commit'])) {
    r.error(
      'BAD_DATE',
      `${path}.last_commit`,
      `expected yyyy-mm-dd or null, got ${describe(raw['last_commit'])}`,
    )
    ok = false
  }
  for (const field of ['first_indexed', 'verified_at'] as const) {
    if (!isDate(raw[field])) {
      r.error('BAD_DATE', `${path}.${field}`, `expected yyyy-mm-dd, got ${describe(raw[field])}`)
      ok = false
    }
  }

  return ok ? (raw as unknown as Node) : null
}

function checkPlacedNodes(r: Report, raw: unknown, path: string): PlacedNode[] {
  if (!Array.isArray(raw)) {
    r.error('BAD_NODE_FIELD', path, `expected an array, got ${describe(raw)}`)
    return []
  }
  const out: PlacedNode[] = []
  raw.forEach((entry, i) => {
    const ep = `${path}[${i}]`
    if (!isObject(entry)) {
      r.error('BAD_NODE_FIELD', ep, `expected an object, got ${describe(entry)}`)
      return
    }
    let ok = checkString(r, entry['id'], `${ep}.id`)
    if (!checkEnum(r, entry['side'], SIDES, `${ep}.side`)) ok = false
    const t = entry['t']
    if (typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t > 1) {
      r.error('BAD_T', `${ep}.t`, `expected a finite number in [0, 1], got ${describe(t)}`)
      ok = false
    }
    if (ok) out.push(entry as unknown as PlacedNode)
  })
  return out
}

function checkPathD(r: Report, raw: unknown, path: string): string {
  if (typeof raw !== 'string' || !/^\s*M/.test(raw)) {
    r.error('BAD_PATH_D', path, `expected an SVG path starting with M, got ${describe(raw)}`)
    return ''
  }
  return raw
}

function checkAct(r: Report, raw: unknown, path: string): Act | null {
  if (!isObject(raw)) {
    r.error('BAD_NODE_FIELD', path, `expected an object, got ${describe(raw)}`)
    return null
  }
  let ok = checkString(r, raw['id'], `${path}.id`)
  if (!checkString(r, raw['title'], `${path}.title`)) ok = false
  if (typeof raw['subtitle'] !== 'string') {
    r.error('BAD_NODE_FIELD', `${path}.subtitle`, `expected a string, got ${describe(raw['subtitle'])}`)
    ok = false
  }
  if (!checkString(r, raw['viewBox'], `${path}.viewBox`)) ok = false
  if (!checkEnum(r, raw['curve'], CURVE_IDS, `${path}.curve`)) ok = false
  if (checkPathD(r, raw['path'], `${path}.path`) === '') ok = false

  const nodes = checkPlacedNodes(r, raw['nodes'], `${path}.nodes`)
  // Only an act that is well-formed but empty is worth a warning; a malformed
  // `nodes` value has already been reported as an error by checkPlacedNodes.
  if (Array.isArray(raw['nodes']) && nodes.length === 0) {
    r.warn('EMPTY_ACT', `${path}.nodes`, 'act places no nodes')
  }
  for (let i = 1; i < nodes.length; i += 1) {
    const prev = nodes[i - 1]
    const cur = nodes[i]
    if (prev && cur && cur.t < prev.t) {
      r.error('ACT_T_UNSORTED', `${path}.nodes[${i}]`, `t ${cur.t} follows ${prev.t}; expected ascending`)
      ok = false
      break
    }
  }

  return ok ? (raw as unknown as Act) : null
}

function checkBranch(r: Report, raw: unknown, path: string): Branch | null {
  if (!isObject(raw)) {
    r.error('BAD_NODE_FIELD', path, `expected an object, got ${describe(raw)}`)
    return null
  }
  let ok = checkString(r, raw['id'], `${path}.id`)
  if (!checkString(r, raw['title'], `${path}.title`)) ok = false
  if (!checkString(r, raw['anchor'], `${path}.anchor`)) ok = false
  if (!checkString(r, raw['act'], `${path}.act`)) ok = false
  if (!checkString(r, raw['viewBox'], `${path}.viewBox`)) ok = false
  if (checkPathD(r, raw['path'], `${path}.path`) === '') ok = false
  checkPlacedNodes(r, raw['nodes'], `${path}.nodes`)
  return ok ? (raw as unknown as Branch) : null
}

// ---------------------------------------------------------------------------
// Integrity checks over the whole registry.
// ---------------------------------------------------------------------------

function checkNodeIntegrity(r: Report, nodes: Node[], byId: Map<string, Node>): void {
  nodes.forEach((node, i) => {
    const path = `nodes[${i}]`

    if (node.blurb.length > MAX_BLURB_LENGTH) {
      r.error(
        'BLURB_TOO_LONG',
        `${path}.blurb`,
        `${node.blurb.length} characters; the limit is ${MAX_BLURB_LENGTH}`,
      )
    }
    if (node.links.length === 0) {
      r.error('NO_LINKS', `${path}.links`, `node "${node.id}" points nowhere`)
    }
    if (node.tracks.length === 0) {
      r.error('ORPHAN_NODE', `${path}.tracks`, `node "${node.id}" claims no tracks`)
    }
    if (node.last_commit === null) {
      if (node.status !== 'emerging') {
        r.error(
          'DATELESS_NOT_EMERGING',
          `${path}.status`,
          `node "${node.id}" has no last_commit so its status must be "emerging", not "${node.status}"`,
        )
      }
      if (node.note === undefined || node.note.trim().length === 0) {
        r.error(
          'DATELESS_NO_NOTE',
          `${path}.note`,
          `node "${node.id}" has no last_commit and must carry a note saying why`,
        )
      }
    }

    node.requires.forEach((req, j) => {
      const rp = `${path}.requires[${j}]`
      if (req === node.id) {
        r.error('SELF_REQUIRE', rp, `node "${node.id}" requires itself`)
        return
      }
      const parent = byId.get(req)
      if (!parent) {
        r.error('DANGLING_REQUIRE', rp, `node "${node.id}" requires unknown node "${req}"`)
        return
      }
      if (node.zone === 'main' && parent.zone === 'frontier') {
        r.error(
          'MAIN_REQUIRES_FRONTIER',
          rp,
          `main-zone node "${node.id}" requires frontier node "${req}"`,
        )
      }
    })
  })

  checkRequireCycles(r, nodes, byId)
}

/** Iterative depth-first search so a deep graph cannot blow the stack. */
function checkRequireCycles(r: Report, nodes: Node[], byId: Map<string, Node>): void {
  const WHITE = 0
  const GREY = 1
  const BLACK = 2
  const colour = new Map<string, number>(nodes.map((n) => [n.id, WHITE]))
  const reported = new Set<string>()

  for (const start of nodes) {
    if (colour.get(start.id) !== WHITE) continue
    const stack: Array<{ id: string; next: number }> = [{ id: start.id, next: 0 }]
    colour.set(start.id, GREY)

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      if (!frame) break
      const node = byId.get(frame.id)
      const requires = node ? node.requires : []

      if (frame.next >= requires.length) {
        colour.set(frame.id, BLACK)
        stack.pop()
        continue
      }

      const next = requires[frame.next]
      frame.next += 1
      if (next === undefined || !byId.has(next)) continue // already reported as DANGLING_REQUIRE

      const state = colour.get(next)
      if (state === GREY) {
        const key = [...stack.map((f) => f.id), next].join(' -> ')
        if (!reported.has(next)) {
          reported.add(next)
          r.error('REQUIRE_CYCLE', `nodes[id=${next}].requires`, `requires cycle: ${key}`)
        }
      } else if (state === WHITE) {
        colour.set(next, GREY)
        stack.push({ id: next, next: 0 })
      }
    }
  }
}

function checkTrackIntegrity(
  r: Report,
  trackId: TrackId,
  track: Track,
  byId: Map<string, Node>,
  allNodes: Node[],
  foundations: string[],
): void {
  const path = `tracks.${trackId}`

  if (track.id !== trackId) {
    r.error('TRACK_KEY_MISMATCH', `${path}.id`, `track keyed "${trackId}" declares id "${track.id}"`)
  }

  const actIds = new Set(track.acts.map((a) => a.id))
  const placedInActs = new Set<string>()
  const seen = new Set<string>()
  const duplicates: string[] = []

  const visit = (id: string, where: string): void => {
    const node = byId.get(id)
    if (!node) {
      r.error('UNKNOWN_PLACED_NODE', where, `"${id}" is not in the node registry`)
      return
    }
    if (!node.tracks.includes(trackId)) {
      r.error(
        'PLACED_OFF_TRACK',
        where,
        `"${id}" is placed on track "${trackId}" but its tracks are [${node.tracks.join(', ')}]`,
      )
    }
    if (seen.has(id)) duplicates.push(id)
    seen.add(id)
  }

  track.acts.forEach((act, ai) => {
    act.nodes.forEach((placed, ni) => {
      placedInActs.add(placed.id)
      visit(placed.id, `${path}.acts[${ai}].nodes[${ni}]`)
      const node = byId.get(placed.id)
      if (node && node.zone === 'frontier') {
        r.warn(
          'FRONTIER_ON_MAIN_PATH',
          `${path}.acts[${ai}].nodes[${ni}]`,
          `frontier node "${placed.id}" sits on the main path instead of a branch`,
        )
      }
    })
  })

  track.branches.forEach((branch, bi) => {
    const bp = `${path}.branches[${bi}]`
    if (!byId.has(branch.anchor)) {
      r.error('UNKNOWN_ANCHOR', `${bp}.anchor`, `"${branch.anchor}" is not in the node registry`)
    } else if (!placedInActs.has(branch.anchor)) {
      r.error(
        'ANCHOR_NOT_ON_TRACK',
        `${bp}.anchor`,
        `anchor "${branch.anchor}" is not placed in any act of track "${trackId}"`,
      )
    }
    if (!actIds.has(branch.act)) {
      r.error('UNKNOWN_BRANCH_ACT', `${bp}.act`, `"${branch.act}" is not an act of track "${trackId}"`)
    }
    branch.nodes.forEach((placed, ni) => {
      visit(placed.id, `${bp}.nodes[${ni}]`)
      const node = byId.get(placed.id)
      if (node && node.zone !== 'frontier') {
        r.error(
          'BRANCH_NODE_NOT_FRONTIER',
          `${bp}.nodes[${ni}]`,
          `"${placed.id}" is zone "${node.zone}"; only frontier nodes belong on a branch`,
        )
      }
    })
  })

  for (const id of new Set(duplicates)) {
    r.error('DUPLICATE_PLACEMENT', path, `"${id}" is placed more than once on track "${trackId}"`)
  }

  for (const node of allNodes) {
    if (node.tracks.includes(trackId) && !seen.has(node.id)) {
      r.error(
        'UNPLACED_NODE',
        `${path}`,
        `node "${node.id}" claims track "${trackId}" but is placed nowhere on it`,
      )
    }
  }

  const order = readingOrder(track)
  const position = new Map<string, number>()
  order.forEach((id, i) => {
    if (!position.has(id)) position.set(id, i)
  })
  order.forEach((id, i) => {
    const node = byId.get(id)
    if (!node) return
    for (const req of node.requires) {
      if (!byId.has(req)) continue // already reported as DANGLING_REQUIRE
      const at = position.get(req)
      if (at === undefined) {
        r.error(
          'PREREQ_OFF_TRACK',
          `${path}`,
          `"${id}" requires "${req}", which is not on track "${trackId}" at all`,
        )
      } else if (at >= i) {
        r.error(
          'PREREQ_AFTER',
          `${path}`,
          `"${id}" is at position ${i} on track "${trackId}" but requires "${req}" at position ${at}`,
        )
      }
    }
  })

  const firstAct = track.acts[0]
  const opening = firstAct ? firstAct.nodes.slice(0, foundations.length).map((n) => n.id) : []
  if (opening.length !== foundations.length || opening.some((id, i) => id !== foundations[i])) {
    r.error(
      'FOUNDATIONS_PREFIX',
      `${path}.acts[0].nodes`,
      `track "${trackId}" opens with [${opening.join(', ')}]; every track must open with [${foundations.join(', ')}]`,
    )
  }
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------

/**
 * Validate the two registry files against each other. Never throws — malformed
 * input comes back as issues, including `null` or a string in place of a file.
 */
export function validateRegistry(nodesRaw: unknown, tracksRaw: unknown): ValidationResult {
  const r = new Report()

  if (!isObject(nodesRaw)) {
    r.error('BAD_ROOT', 'nodes.json', `expected an object, got ${describe(nodesRaw)}`)
  }
  if (!isObject(tracksRaw)) {
    r.error('BAD_ROOT', 'tracks.json', `expected an object, got ${describe(tracksRaw)}`)
  }
  if (!isObject(nodesRaw) || !isObject(tracksRaw)) return r.result()

  for (const [label, file] of [
    ['nodes.json', nodesRaw],
    ['tracks.json', tracksRaw],
  ] as const) {
    if (typeof file['version'] !== 'number') {
      r.error('BAD_ROOT', `${label}.version`, `expected a number, got ${describe(file['version'])}`)
    }
    if (!isDate(file['generated'])) {
      r.error('BAD_ROOT', `${label}.generated`, `expected yyyy-mm-dd, got ${describe(file['generated'])}`)
    }
  }

  if (!Array.isArray(nodesRaw['nodes'])) {
    r.error('BAD_ROOT', 'nodes.json.nodes', `expected an array, got ${describe(nodesRaw['nodes'])}`)
    return r.result()
  }

  const nodes: Node[] = []
  const byId = new Map<string, Node>()
  nodesRaw['nodes'].forEach((raw, i) => {
    const node = checkNode(r, raw, `nodes[${i}]`)
    if (!node) return
    if (byId.has(node.id)) {
      r.error('DUPLICATE_NODE_ID', `nodes[${i}].id`, `"${node.id}" is already defined`)
      return
    }
    byId.set(node.id, node)
    nodes.push(node)
  })

  checkNodeIntegrity(r, nodes, byId)

  const geometry = tracksRaw['geometry']
  if (!isObject(geometry)) {
    r.error('BAD_ROOT', 'tracks.json.geometry', `expected an object, got ${describe(geometry)}`)
  } else {
    checkString(r, geometry['viewBox'], 'tracks.json.geometry.viewBox', 'BAD_ROOT')
    checkPathD(r, geometry['branchPath'], 'tracks.json.geometry.branchPath')
    const curves = geometry['curves']
    if (!isObject(curves)) {
      r.error('BAD_ROOT', 'tracks.json.geometry.curves', `expected an object, got ${describe(curves)}`)
    } else {
      for (const id of CURVE_IDS) {
        checkPathD(r, curves[id], `tracks.json.geometry.curves.${id}`)
      }
    }
  }

  const foundationsRaw = tracksRaw['foundations']
  const foundations: string[] = []
  if (!Array.isArray(foundationsRaw)) {
    r.error(
      'BAD_ROOT',
      'tracks.json.foundations',
      `expected an array, got ${describe(foundationsRaw)}`,
    )
  } else {
    foundationsRaw.forEach((id, i) => {
      if (!checkString(r, id, `tracks.json.foundations[${i}]`, 'BAD_ROOT')) return
      if (!byId.has(id as string)) {
        r.error(
          'DANGLING_REQUIRE',
          `tracks.json.foundations[${i}]`,
          `foundation "${String(id)}" is not in the node registry`,
        )
        return
      }
      foundations.push(id as string)
    })
  }

  const tracksRoot = tracksRaw['tracks']
  if (!isObject(tracksRoot)) {
    r.error('BAD_ROOT', 'tracks.json.tracks', `expected an object, got ${describe(tracksRoot)}`)
    return r.result()
  }

  for (const key of Object.keys(tracksRoot)) {
    if (!(TRACK_IDS as readonly string[]).includes(key)) {
      r.error('BAD_ENUM', `tracks.json.tracks.${key}`, `"${key}" is not a known track id`)
    }
  }

  for (const trackId of TRACK_IDS) {
    const raw = tracksRoot[trackId]
    const path = `tracks.${trackId}`
    if (!isObject(raw)) {
      r.error('BAD_ROOT', path, `expected an object, got ${describe(raw)}`)
      continue
    }
    let ok = checkString(r, raw['id'], `${path}.id`)
    if (!checkString(r, raw['title'], `${path}.title`)) ok = false
    if (!checkString(r, raw['destination'], `${path}.destination`)) ok = false

    const acts: Act[] = []
    if (!Array.isArray(raw['acts'])) {
      r.error('BAD_ROOT', `${path}.acts`, `expected an array, got ${describe(raw['acts'])}`)
      ok = false
    } else {
      raw['acts'].forEach((a, i) => {
        const act = checkAct(r, a, `${path}.acts[${i}]`)
        if (act) acts.push(act)
        else ok = false
      })
    }

    const branches: Branch[] = []
    if (!Array.isArray(raw['branches'])) {
      r.error('BAD_ROOT', `${path}.branches`, `expected an array, got ${describe(raw['branches'])}`)
      ok = false
    } else {
      raw['branches'].forEach((b, i) => {
        const branch = checkBranch(r, b, `${path}.branches[${i}]`)
        if (branch) branches.push(branch)
        else ok = false
      })
    }

    if (!ok) continue

    const track: Track = {
      id: raw['id'] as TrackId,
      title: raw['title'] as string,
      destination: raw['destination'] as string,
      acts,
      branches,
    }
    checkTrackIntegrity(r, trackId, track, byId, nodes, foundations)
  }

  return r.result()
}

/** One line per issue, for a terminal or a console. */
export function formatIssues(issues: Issue[]): string {
  return issues
    .map((i) => `${i.severity === 'error' ? 'error' : 'warn '}  ${i.code}  ${i.path}\n         ${i.message}`)
    .join('\n')
}
