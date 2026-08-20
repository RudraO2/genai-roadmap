/**
 * The graph layout. Turns a path — stages, nodes, prerequisite edges — into
 * absolute geometry: a box per node, a band per stage, and a routed path string
 * per edge.
 *
 * Pure, deterministic and free of the DOM, so the same input always produces the
 * same picture and the whole thing can be reasoned about without a browser.
 *
 * Why a real layout rather than a single curve: a roadmap is not a line. "Give it
 * your data" and "make it act" are genuinely parallel — either can come first, and
 * plenty of people need only one. A line has to lie about that; a graph does not.
 *
 * Coordinates are in CSS pixels of an unscaled canvas. The viewer applies zoom as
 * a transform on the wrapper, so nothing here has to know about it.
 */

import type { RoadmapNode, Stage, StageId } from '../types.ts'
import { registry } from './roadmap.ts'

/** Grid metrics. The one place the picture's proportions are decided. */
export const METRICS = {
  columns: 4,
  nodeW: 236,
  nodeH: 108,
  colGap: 28,
  rowGap: 64,
  padX: 28,
  /** Height of a stage's title block, plus the clear space beneath it. */
  headerH: 74,
  /** The same block with no boxes under it: the title and its tally, and stop. */
  collapsedH: 54,
  headerClearance: 30,
  /** Vertical space between the last row of a band and the next band's header. */
  bandGap: 52,
  /** Corner radius on a routed edge. */
  corner: 14,
} as const

export const CANVAS_WIDTH =
  METRICS.padX * 2 + METRICS.columns * METRICS.nodeW + (METRICS.columns - 1) * METRICS.colGap

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface LaidNode {
  node: RoadmapNode
  box: Box
}

export interface LaidBand {
  stage: Stage
  /** Top of the whole band, which is also the top of its header block. */
  y: number
  height: number
  headerHeight: number
  nodes: readonly LaidNode[]
  /** True when the band is drawn as its header alone — see `LayoutOptions`. */
  collapsed: boolean
  /** How many quests the band holds after filtering, collapsed or not. */
  count: number
}

/**
 * An edge's state, read off the completed set:
 *   walked  both ends done — the road behind the learner
 *   open    the prerequisite is done, so the far end is reachable now
 *   ahead   not yet earned
 */
export type EdgeState = 'walked' | 'open' | 'ahead'

export interface LaidEdge {
  id: string
  from: string
  to: string
  /** SVG path `d`, already routed and rounded. */
  d: string
  state: EdgeState
  /** True when either end is a side quest, which the stylesheet draws dashed. */
  optional: boolean
}

export interface GraphLayout {
  width: number
  height: number
  bands: readonly LaidBand[]
  nodes: ReadonlyMap<string, LaidNode>
  edges: readonly LaidEdge[]
}

interface Point {
  x: number
  y: number
}

function columnX(col: number): number {
  return METRICS.padX + col * (METRICS.nodeW + METRICS.colGap)
}

function towards(from: Point, to: Point, distance: number): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (length === 0) return { ...from }
  const ratio = Math.min(1, distance / length)
  return { x: from.x + dx * ratio, y: from.y + dy * ratio }
}

/**
 * A polyline with rounded corners, as one `d` string. Each interior vertex is cut
 * back along both of its segments and bridged with a quadratic through the corner,
 * so the radius can never exceed half of the shorter neighbouring segment and a
 * tight jog degrades to a sharp corner instead of overshooting into a loop.
 */
function roundedPath(points: readonly Point[], radius: number): string {
  const [first] = points
  if (!first) return ''
  if (points.length === 1) return `M ${first.x} ${first.y}`

  let d = `M ${first.x} ${first.y}`
  for (let i = 1; i < points.length - 1; i += 1) {
    const previous = points[i - 1]!
    const corner = points[i]!
    const next = points[i + 1]!
    const limit = Math.min(
      radius,
      Math.hypot(corner.x - previous.x, corner.y - previous.y) / 2,
      Math.hypot(next.x - corner.x, next.y - corner.y) / 2,
    )
    const into = towards(corner, previous, limit)
    const out = towards(corner, next, limit)
    d += ` L ${into.x} ${into.y} Q ${corner.x} ${corner.y} ${out.x} ${out.y}`
  }
  const last = points[points.length - 1]!
  return `${d} L ${last.x} ${last.y}`
}

/**
 * Route one edge between two boxes.
 *
 * Downward is the ordinary case and gets the classic orthogonal jog: straight down
 * out of the bottom, across at the midpoint, straight down into the top. Same-row
 * edges leave and enter through the sides instead, which is what keeps a
 * prerequisite that sits beside its dependent from drawing a line through the card
 * between them.
 *
 * The registry forbids an edge that points upward on any path it is visible on, so
 * the remaining case is defensive only: it swings out to the right rather than
 * drawing a line back through everything in between.
 */
function routeEdge(from: Box, to: Box): string {
  const fromCentre = from.x + from.w / 2
  const toCentre = to.x + to.w / 2

  if (to.y >= from.y + from.h) {
    const start = { x: fromCentre, y: from.y + from.h }
    const end = { x: toCentre, y: to.y }
    if (Math.abs(start.x - end.x) < 1) return roundedPath([start, end], METRICS.corner)
    const midY = start.y + (end.y - start.y) / 2
    return roundedPath(
      [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end],
      METRICS.corner,
    )
  }

  const verticallyOverlapping = to.y < from.y + from.h && to.y + to.h > from.y
  if (verticallyOverlapping) {
    const rightwards = to.x > from.x
    const start = { x: rightwards ? from.x + from.w : from.x, y: from.y + from.h / 2 }
    const end = { x: rightwards ? to.x : to.x + to.w, y: to.y + to.h / 2 }
    if (Math.abs(start.y - end.y) < 1) return roundedPath([start, end], METRICS.corner)
    const midX = start.x + (end.x - start.x) / 2
    return roundedPath(
      [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end],
      METRICS.corner,
    )
  }

  // Upward: out of the right edge, around, and back in through the right edge.
  const lane = Math.max(from.x + from.w, to.x + to.w) + METRICS.colGap / 2
  const start = { x: from.x + from.w, y: from.y + from.h / 2 }
  const end = { x: to.x + to.w, y: to.y + to.h / 2 }
  return roundedPath(
    [start, { x: lane, y: start.y }, { x: lane, y: end.y }, end],
    METRICS.corner,
  )
}

export interface LayoutOptions {
  /** Node ids to leave out entirely. Their edges are dropped with them. */
  hidden?: ReadonlySet<string>
  /** Completed node ids, which decide each edge's state. */
  completed?: ReadonlySet<string>
  /**
   * Stages drawn as a header row and nothing else.
   *
   * This is what keeps a fifty-nine-quest path from opening as six thousand
   * pixels of wall. A collapsed band keeps its title, its kicker and its tally,
   * so the *shape* of the path — how many stages, how far in you are, what each
   * one is called — survives at a fraction of the height; only the boxes go.
   *
   * Distinct from `hidden`, which means "this quest is filtered out". Here the
   * quests still count in the band's tally, they are simply not drawn, and
   * their edges drop out with them because an edge to a box that is not on the
   * canvas has nowhere to land.
   */
  collapsed?: ReadonlySet<StageId>
}

/**
 * Lay out one path.
 *
 * Rows are compacted after filtering: hiding every side quest in a stage must close
 * the gap rather than leave a stripe of empty canvas. Authored row order is
 * preserved, so a prerequisite never ends up below its dependent as a result.
 */
export function computeLayout(pathId: string, options: LayoutOptions = {}): GraphLayout {
  const hidden = options.hidden ?? new Set<string>()
  const completed = options.completed ?? new Set<string>()
  const collapsed = options.collapsed ?? new Set<StageId>()
  const path = registry.getPath(pathId)

  const bands: LaidBand[] = []
  const nodes = new Map<string, LaidNode>()
  let cursor = 0

  for (const stageId of path.stages) {
    const stageNodes = registry.nodesInStage(stageId).filter((node) => !hidden.has(node.id))
    if (stageNodes.length === 0) continue

    if (collapsed.has(stageId)) {
      bands.push({
        stage: registry.getStage(stageId),
        y: cursor,
        height: METRICS.collapsedH,
        headerHeight: METRICS.collapsedH,
        nodes: [],
        collapsed: true,
        count: stageNodes.length,
      })
      cursor += METRICS.collapsedH + METRICS.bandGap
      continue
    }

    const rows = [...new Set(stageNodes.map((node) => node.row))].sort((a, b) => a - b)
    const rowIndex = new Map(rows.map((row, index) => [row, index]))
    const contentY = cursor + METRICS.headerH + METRICS.headerClearance

    const laid = stageNodes.map((node) => {
      const box: Box = {
        x: columnX(node.col),
        y: contentY + (rowIndex.get(node.row) ?? 0) * (METRICS.nodeH + METRICS.rowGap),
        w: METRICS.nodeW,
        h: METRICS.nodeH,
      }
      const entry: LaidNode = { node, box }
      nodes.set(node.id, entry)
      return entry
    })

    const height =
      METRICS.headerH +
      METRICS.headerClearance +
      rows.length * METRICS.nodeH +
      (rows.length - 1) * METRICS.rowGap

    bands.push({
      stage: registry.getStage(stageId),
      y: cursor,
      height,
      headerHeight: METRICS.headerH,
      nodes: laid,
      collapsed: false,
      count: stageNodes.length,
    })
    cursor += height + METRICS.bandGap
  }

  const edges: LaidEdge[] = []
  for (const { node, box } of nodes.values()) {
    for (const requiredId of node.requires) {
      const source = nodes.get(requiredId)
      if (!source) continue
      const sourceDone = completed.has(requiredId)
      edges.push({
        id: `${requiredId}->${node.id}`,
        from: requiredId,
        to: node.id,
        d: routeEdge(source.box, box),
        state: sourceDone ? (completed.has(node.id) ? 'walked' : 'open') : 'ahead',
        optional: source.node.type === 'side' || node.type === 'side',
      })
    }
  }

  return {
    width: CANVAS_WIDTH,
    height: Math.max(0, cursor - METRICS.bandGap),
    bands,
    nodes,
    edges,
  }
}
