/**
 * Every shape shared across the app. Types only — this file emits no runtime code.
 * The runtime companions (union member lists, ranks) live in `constants.ts`.
 *
 * These mirror `data/roadmap.json` exactly. A node stores a pointer to a resource
 * and instructions for what to do with it; it never stores a copy of what is at
 * the far end of the link.
 */

export type Level = 'beginner' | 'intermediate' | 'advanced'

/**
 * What kind of stop this is, which is also what it is worth.
 *   core   the spine of a stage — skip it and the rest wobbles
 *   side   a worthwhile detour, never a prerequisite for anything on the spine
 *   build  a quest: you make something and it either works or it does not
 *   boss   a stage capstone, several days of work, the thing you show people
 */
export type NodeType = 'core' | 'side' | 'build' | 'boss'

/** What is at the other end of a link. Drives the chip printed beside it. */
export type LinkKind = 'repo' | 'course' | 'tool' | 'docs' | 'list' | 'playground'

/** Where a search button sends you. Each builds a live query URL, so it cannot rot. */
export type SearchEngine = 'google' | 'youtube' | 'github'

export type PathId = string
export type StageId = string

export interface ResourceLink {
  label: string
  url: string
  kind: LinkKind
  /** GitHub star count at the time the link was verified. Absent for non-repos. */
  stars?: number
  /**
   * True when the URL was fetched successfully while the registry was written.
   * False means it could not be reached from the build environment, in which case
   * it is restricted to a stable site root — never a deep path that may not exist.
   */
  verified: boolean
}

export interface SearchQuery {
  on: SearchEngine
  q: string
}

/**
 * One stop on the map: a thing to learn, with instructions for learning it.
 *
 * `requires` is the edge list. It is a DAG, not a line — a node may have several
 * prerequisites and several dependents, which is the whole reason this is drawn
 * as a graph rather than as a road.
 */
export interface RoadmapNode {
  id: string
  title: string
  blurb: string
  stage: StageId
  /** Authored grid position inside the stage. Columns 0-3, rows top to bottom. */
  col: number
  row: number
  level: Level
  type: NodeType
  requires: string[]
  /**
   * How long this takes: `<n>m`, `<n>h`, `<n>d`, `<n>w`, or `ongoing` for a
   * habit. Printed as written, and summed into the path's remaining time by
   * `data/duration.ts`, which is also where the day and week assumptions live.
   * The validator rejects anything else.
   */
  est: string
  xp: number
  /** One imperative sentence: the thing to actually do. */
  mission: string
  /** Why it is worth doing, and why now rather than later. */
  why: string
  steps: string[]
  /** Observable finishing conditions. Not "understand X" — something you can check. */
  done_when: string[]
  links: ResourceLink[]
  search: SearchQuery[]
  tags: string[]
}

export interface Stage {
  id: StageId
  title: string
  kicker: string
  summary: string
}

export interface LearningPath {
  id: PathId
  title: string
  tagline: string
  goal: string
  for: string
  /** Stage ids in the order this path walks them. The path's whole structure. */
  stages: StageId[]
}

export interface RoadmapFile {
  version: number
  generated: string
  note: string
  paths: LearningPath[]
  stages: Stage[]
  nodes: RoadmapNode[]
}

/**
 * A node's state for one learner, derived from the completed set and nothing else.
 *   done      ticked
 *   ready     every prerequisite ticked — this is what "do it now" means
 *   locked    at least one prerequisite outstanding
 *
 * Locked never means hidden. A locked card is dimmed, still readable and still
 * opens: knowing what is coming is half of what a roadmap is for.
 */
export type NodeState = 'done' | 'ready' | 'locked'
