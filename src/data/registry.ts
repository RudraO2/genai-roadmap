/**
 * The loader. Imports both registry files, validates them once at module load,
 * and exposes indexed lookups. Every other spec reads the registry through here
 * and nothing else parses `data/*.json` a second time.
 *
 * Validation failure is a hard stop rather than a degraded render: a registry that
 * disagrees with itself would put nodes on the map before their prerequisites, and
 * a silently wrong map is worse than no map.
 */

import nodesRaw from '../../data/nodes.json'
import tracksRaw from '../../data/tracks.json'
import { TRACK_IDS } from '../constants.ts'
import type { Act, Branch, Geometry, Node, Track, TrackId } from '../types.ts'
import { readingOrder } from './order.ts'
import { formatIssues, validateRegistry, type Issue } from './validate.ts'

export class RegistryError extends Error {
  readonly issues: Issue[]

  constructor(issues: Issue[]) {
    super(`registry validation failed with ${issues.length} error(s):\n${formatIssues(issues)}`)
    this.name = 'RegistryError'
    this.issues = issues
  }
}

export interface Registry {
  nodes: readonly Node[]
  nodesById: ReadonlyMap<string, Node>
  tracks: Readonly<Record<TrackId, Track>>
  trackIds: readonly TrackId[]
  foundations: readonly string[]
  geometry: Geometry
  /** Reading order for a track: act by act, each act's nodes then its branches' nodes. */
  orderedNodeIds(track: TrackId): string[]
  /** The same order, resolved to nodes. */
  nodesForTrack(track: TrackId): Node[]
  actsForTrack(track: TrackId): readonly Act[]
  branchesForAct(track: TrackId, actId: string): Branch[]
  /** Throws on an unknown id rather than returning undefined. */
  getNode(id: string): Node
}

const validation = validateRegistry(nodesRaw, tracksRaw)
if (!validation.ok) throw new RegistryError(validation.errors)

const nodesFile = nodesRaw as unknown as { nodes: Node[] }
const tracksFile = tracksRaw as unknown as {
  geometry: Geometry
  foundations: string[]
  tracks: Record<TrackId, Track>
}

const nodes: readonly Node[] = Object.freeze([...nodesFile.nodes])
const nodesById: ReadonlyMap<string, Node> = new Map(nodes.map((n) => [n.id, n]))

function requireTrack(id: TrackId): Track {
  const track = tracksFile.tracks[id]
  if (!track) throw new RegistryError([
    { code: 'BAD_ROOT', severity: 'error', path: `tracks.${id}`, message: `track "${id}" is missing` },
  ])
  return track
}

function orderedNodeIds(id: TrackId): string[] {
  return readingOrder(requireTrack(id))
}

function getNode(id: string): Node {
  const node = nodesById.get(id)
  if (!node) throw new Error(`unknown node id: "${id}"`)
  return node
}

export const registry: Registry = {
  nodes,
  nodesById,
  tracks: tracksFile.tracks,
  trackIds: TRACK_IDS,
  foundations: Object.freeze([...tracksFile.foundations]),
  geometry: tracksFile.geometry,
  orderedNodeIds,
  nodesForTrack: (id) => orderedNodeIds(id).map(getNode),
  actsForTrack: (id) => requireTrack(id).acts,
  branchesForAct: (id, actId) => requireTrack(id).branches.filter((b) => b.act === actId),
  getNode,
}

/** Warnings do not block the load, but the console should still say so. */
export const registryWarnings: readonly Issue[] = Object.freeze([...validation.warnings])
