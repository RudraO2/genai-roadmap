/**
 * The loader. Imports the registry, validates it once at module load, and exposes
 * indexed lookups. Every other module reads the roadmap through here; nothing else
 * parses `data/roadmap.json` a second time.
 *
 * Validation failure is a hard stop rather than a degraded render. A registry that
 * disagrees with itself would show a beginner an impossible order, and a silently
 * wrong roadmap is worse than no roadmap.
 */

// The import attribute is load-bearing in both directions: Vite needs no help
// with a JSON import, but plain Node does, and without it this module — and so
// every module that reads the registry — could not be loaded by the test runner.
// Do not remove it.
import raw from '../../data/roadmap.json' with { type: 'json' }
import type { LearningPath, PathId, RoadmapFile, RoadmapNode, Stage, StageId } from '../types.ts'
import { formatIssues, validateRoadmap, type Issue } from './validate.ts'

export class RegistryError extends Error {
  readonly issues: Issue[]

  constructor(issues: Issue[]) {
    super(`roadmap validation failed with ${issues.length} error(s):\n${formatIssues(issues)}`)
    this.name = 'RegistryError'
    this.issues = issues
  }
}

const validation = validateRoadmap(raw)
if (!validation.ok) throw new RegistryError(validation.errors)

const file = raw as unknown as RoadmapFile

const nodes: readonly RoadmapNode[] = Object.freeze([...file.nodes])
const nodesById: ReadonlyMap<string, RoadmapNode> = new Map(nodes.map((n) => [n.id, n]))
const stages: readonly Stage[] = Object.freeze([...file.stages])
const stagesById: ReadonlyMap<StageId, Stage> = new Map(stages.map((s) => [s.id, s]))
const paths: readonly LearningPath[] = Object.freeze([...file.paths])
const pathsById: ReadonlyMap<PathId, LearningPath> = new Map(paths.map((p) => [p.id, p]))

/** Who depends on this node. The inverse of `requires`, built once. */
const unlocksById = new Map<string, string[]>()
for (const node of nodes) {
  for (const id of node.requires) {
    const list = unlocksById.get(id)
    if (list) list.push(node.id)
    else unlocksById.set(id, [node.id])
  }
}

/** Nodes of one stage, in the reading order the layout also uses. */
const nodesByStage = new Map<StageId, RoadmapNode[]>()
for (const node of nodes) {
  const list = nodesByStage.get(node.stage)
  if (list) list.push(node)
  else nodesByStage.set(node.stage, [node])
}
for (const list of nodesByStage.values()) {
  list.sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row))
}

function getNode(id: string): RoadmapNode {
  const node = nodesById.get(id)
  if (!node) throw new Error(`unknown node id: "${id}"`)
  return node
}

function getPath(id: PathId): LearningPath {
  const path = pathsById.get(id)
  if (!path) throw new Error(`unknown path id: "${id}"`)
  return path
}

function getStage(id: StageId): Stage {
  const stage = stagesById.get(id)
  if (!stage) throw new Error(`unknown stage id: "${id}"`)
  return stage
}

/** Every node on a path, in walking order: stage by stage, then row, then column. */
function nodesForPath(id: PathId): RoadmapNode[] {
  return getPath(id).stages.flatMap((stage) => nodesByStage.get(stage) ?? [])
}

export const registry = {
  generated: file.generated,
  note: file.note,
  nodes,
  nodesById,
  stages,
  paths,
  pathIds: Object.freeze(paths.map((p) => p.id)),
  getNode,
  getPath,
  getStage,
  nodesForPath,
  nodesInStage: (id: StageId): readonly RoadmapNode[] => nodesByStage.get(id) ?? [],
  /** Ids of the nodes this one is a prerequisite for. Empty array, never undefined. */
  unlockedBy: (id: string): readonly string[] => unlocksById.get(id) ?? [],
  isPathId: (value: unknown): value is PathId =>
    typeof value === 'string' && pathsById.has(value),
} as const

/** Warnings do not block the load, but the colophon and the console still say so. */
export const registryWarnings: readonly Issue[] = Object.freeze([...validation.warnings])

/** Every link in the registry, for the colophon's count. */
export const linkCount = nodes.reduce((total, node) => total + node.links.length, 0)
