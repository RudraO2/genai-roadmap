/**
 * Every shape shared across specs. Types only — this file emits no runtime code.
 * The runtime companions (union member lists, level ranks) live in `constants.ts`.
 *
 * These mirror `data/nodes.json` and `data/tracks.json` exactly. A node stores a
 * pointer to a URL and metadata about that URL; it never stores a copy of what is
 * at that URL (CONTEXT.md section 3).
 */

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Zone = 'main' | 'frontier'
export type Status = 'core' | 'emerging' | 'dormant' | 'superseded'
export type Kind = 'repo' | 'docs' | 'video' | 'thread' | 'article' | 'playground'
export type TrackId = 'game' | 'app' | 'portfolio' | 'media'
export type Side = 'left' | 'right'
export type CurveId = 'short' | 'medium' | 'long'

export interface Link {
  label: string
  url: string
  kind: Kind
}

export interface Node {
  id: string
  title: string
  blurb: string
  level: Level
  tracks: TrackId[]
  requires: string[]
  links: Link[]
  repo: string | null
  stars: number | null
  /** ISO `yyyy-mm-dd`, or null when the entry is not backed by a public repo. */
  last_commit: string | null
  status: Status
  zone: Zone
  first_indexed: string
  verified_at: string
  /** Required whenever `last_commit` is null: says why freshness is unverifiable. */
  note?: string
}

/**
 * A node id placed on a curve. `t` is 0-1 along the path length; a placed node
 * never stores x/y. Position is `path.getPointAtLength(total * t)` — spec 04.
 */
export interface PlacedNode {
  id: string
  t: number
  side: Side
}

export interface Act {
  id: string
  title: string
  subtitle: string
  viewBox: string
  curve: CurveId
  /** SVG path `d` attribute. The single load-bearing element of the map. */
  path: string
  nodes: PlacedNode[]
}

export interface Branch {
  id: string
  title: string
  /** Node id on the main path this branch spurs off. */
  anchor: string
  /** Act id the anchor lives in. */
  act: string
  viewBox: string
  path: string
  nodes: PlacedNode[]
}

export interface Track {
  id: TrackId
  title: string
  destination: string
  acts: Act[]
  branches: Branch[]
}

export interface Geometry {
  note: string
  viewBox: string
  curves: Record<CurveId, string>
  branchViewBox: string
  branchPath: string
}

export interface NodesFile {
  version: number
  generated: string
  nodes: Node[]
}

export interface TracksFile {
  version: number
  generated: string
  geometry: Geometry
  /** Node ids every track opens with, in order (CONTEXT.md section 4). */
  foundations: string[]
  tracks: Record<TrackId, Track>
}

/** Which way the character is drawn. Left is a `scaleX(-1)` of right, never separate art. */
export type Facing = 'left' | 'right'

/**
 * Sprite layer ids, in the compositing order `prompts/00-antigravity-assets.md`
 * fixes (body → outfit → hair). The code-drawn placeholder carries them without
 * drawing them differently; the sheets that arrive later key off these values.
 */
export interface CharacterVariant {
  body: string
  hair: string
  outfit: string
}
