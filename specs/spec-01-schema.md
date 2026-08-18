# Spec 01 — Types, schema, and data loading

**State:** `IN PROGRESS`
**Depends on:** nothing
**Owns:** `src/types.ts`, `src/data/*`, and the minimal build toolchain

---

## Goal

Give every later spec one place to import a shape from, and one place that decides whether
`data/nodes.json` and `data/tracks.json` are internally consistent. Phase A produced 67
nodes, 101 links, four tracks, 29 acts and 21 frontier branches, and it enforced a set of
invariants while generating them. Nothing in the repo currently re-checks those invariants,
so the next hand edit to a JSON file can break them silently. This spec declares the
TypeScript shapes, writes a runtime validator that re-derives every one of those invariants
from the data itself, and exposes a loader that hands the rest of the app validated, indexed
data. It also lands the minimum Vite + React + TypeScript toolchain required for
`npm run build` and `npx tsc --noEmit` to mean anything at all.

## In scope

- `src/types.ts` — every shared type. Node, Track, Act, Branch, Link, Level, Zone, Status,
  Kind, TrackId, Side, PlacedNode, Geometry, NodesFile, TracksFile.
- `src/constants.ts` — the runtime companion to `types.ts`: the members of each union and
  the numbers the constitution fixes. Kept separate so `types.ts` stays type-only.
- `src/data/order.ts` — the single definition of a track's reading order.
- `src/data/validate.ts` — a pure validator. Takes two `unknown` values, returns a structured
  result. Throws nothing, imports no JSON, touches no globals.
- `src/data/registry.ts` — the loader. Imports both JSON files, validates once at module
  load, throws on error, and exposes indexed lookups.
- `scripts/validate-data.ts` — the same validator run from the command line so a broken
  registry fails loudly outside the browser, wired into `npm run build`.
- The minimal toolchain: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`,
  `src/main.tsx`.

## Out of scope

- Any colour, font, spacing or visual decision. That is spec 02, and `theme.css` does not
  exist yet. `src/main.tsx` in this spec renders unstyled semantic HTML as a smoke test and
  spec 02 replaces its contents wholesale.
- Tailwind. Spec 02 installs and configures it.
- Path geometry maths, `usePathPoint`, `getPointAtLength`. Spec 04 owns all of it. This spec
  only types the geometry fields it finds in `tracks.json`.
- Level filtering, progress, localStorage, routing.
- Editing `data/nodes.json` or `data/tracks.json`. The data is correct as generated; if the
  validator disagrees with the data, the validator is what gets fixed.

## Decision recorded up front

`State of the project.md` assigns the "Vite + React + TypeScript scaffold" line to spec 02.
Spec 01 nonetheless creates `package.json`, `tsconfig.json` and `vite.config.ts`, because
spec 01's own definition of done is "`npm run build` and `npx tsc --noEmit` pass" and neither
command exists until a toolchain does. The split is: **spec 01 owns the toolchain, spec 02
owns the look.** Spec 02 must not run `npm create vite` — it inherits this scaffold and adds
`theme.css`, the typefaces, Tailwind, and the app frame on top.

## Files

| Path | New / changed | What |
| --- | --- | --- |
| `package.json` | new | Scripts and the allowed dependencies only. |
| `tsconfig.json` | new | Strict. `resolveJsonModule`, `noUncheckedIndexedAccess`. |
| `vite.config.ts` | new | React plugin. `base: './'` for a static deploy. |
| `index.html` | new | Bare mount point. No styling. |
| `src/main.tsx` | new | Mounts a smoke-test summary of the loaded registry. |
| `src/types.ts` | new | Every shared type. No logic. |
| `src/constants.ts` | new | Union members, level ranks, constitution constants. |
| `src/data/order.ts` | new | Reading order for a track. One definition only. |
| `src/data/validate.ts` | new | The pure validator. |
| `src/data/registry.ts` | new | Loader plus indexes. |
| `scripts/validate-data.ts` | new | CLI gate over the same validator. |
| `scripts/node-shims.d.ts` | new | The slice of the Node API the CLI script uses. |
| `.gitignore` | changed | Already created; no further change expected. |

There is no `tsconfig.node.json`. A composite referenced project may not set `noEmit`
(TS6310), and every project here is `noEmit`; `vite.config.ts` is simply added to the single
`tsconfig.json` include instead.

`scripts/node-shims.d.ts` exists so the dependency list can stay at exactly the four
libraries CONTEXT.md section 10 allows. It declares only `readFileSync`, `fileURLToPath`,
`dirname`, `join` and `process.exit`. If a later spec needs materially more of the Node API,
that is the moment to log the `@types/node` question to `BLOCKED.md` rather than grow this
file further.

## Interfaces

Other specs import from `src/types.ts` and `src/data/registry.ts` only. Nothing imports
`validate.ts` directly except the loader and the CLI script.

```ts
// src/types.ts
export type Level   = 'beginner' | 'intermediate' | 'advanced'
export type Zone    = 'main' | 'frontier'
export type Status  = 'core' | 'emerging' | 'dormant' | 'superseded'
export type Kind    = 'repo' | 'docs' | 'video' | 'thread' | 'article' | 'playground'
export type TrackId = 'game' | 'app' | 'portfolio' | 'media'
export type Side    = 'left' | 'right'
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
  last_commit: string | null       // ISO yyyy-mm-dd, or null when not repo-backed
  status: Status
  zone: Zone
  first_indexed: string
  verified_at: string
  note?: string                    // required whenever last_commit is null
}

/** A node id placed on a curve. `t` is 0-1 along the path; never x/y. */
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
  path: string                     // SVG path `d`
  nodes: PlacedNode[]
}

export interface Branch {
  id: string
  title: string
  anchor: string                   // node id on the main path this spurs off
  act: string                      // act id the anchor lives in
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
  foundations: string[]
  tracks: Record<TrackId, Track>
}
```

```ts
// src/data/validate.ts
export type Severity = 'error' | 'warning'

export interface Issue {
  code: string        // stable, greppable, e.g. 'DANGLING_REQUIRE'
  severity: Severity
  path: string        // where in the data, e.g. 'nodes[12].requires[0]'
  message: string
}

export interface ValidationResult {
  ok: boolean         // false iff at least one error
  issues: Issue[]
  errors: Issue[]
  warnings: Issue[]
}

export function validateRegistry(nodesRaw: unknown, tracksRaw: unknown): ValidationResult
```

```ts
// src/data/registry.ts
export interface Registry {
  nodes: readonly Node[]
  nodesById: ReadonlyMap<string, Node>
  tracks: Readonly<Record<TrackId, Track>>
  trackIds: readonly TrackId[]
  foundations: readonly string[]
  geometry: Geometry
  /** Reading order for a track: act by act, each act's nodes then its branches' nodes. */
  orderedNodeIds(track: TrackId): string[]
  nodesForTrack(track: TrackId): Node[]
  actsForTrack(track: TrackId): readonly Act[]
  branchesForAct(track: TrackId, actId: string): Branch[]
  getNode(id: string): Node          // throws on unknown id
}

export const registry: Registry
export const registryWarnings: readonly Issue[]
export class RegistryError extends Error { readonly issues: Issue[] }
```

```ts
// src/data/order.ts — imported by both validate.ts and registry.ts so the order the
// validator checks prerequisites against is the order the UI renders.
export function readingOrder(track: Track): string[]
```

## Validation rules

Every rule is an error unless marked warning. Codes are stable — later specs and the build
gate grep for them.

**Shape**

| Code | Rule |
| --- | --- |
| `BAD_ROOT` | Either file is not an object, or is missing `version` / `generated`. |
| `BAD_NODE_FIELD` | A node field is missing or the wrong primitive type. |
| `BAD_ENUM` | `level`, `status`, `zone`, `kind`, `side` or a track id is outside its union. |
| `BAD_DATE` | `last_commit`, `first_indexed` or `verified_at` is not `yyyy-mm-dd`. |
| `BAD_URL` | A link URL does not parse, or its scheme is not `http:` / `https:`. |
| `BAD_T` | A placed node's `t` is not a finite number in `[0, 1]`. |
| `BAD_PATH_D` | An act or branch `path` does not start with `M`. |

**Registry integrity**

| Code | Rule |
| --- | --- |
| `DUPLICATE_NODE_ID` | Two nodes share an `id`. |
| `DANGLING_REQUIRE` | A `requires` entry names no known node. |
| `SELF_REQUIRE` | A node requires itself. |
| `REQUIRE_CYCLE` | The `requires` graph contains a cycle. |
| `MAIN_REQUIRES_FRONTIER` | A `zone: main` node requires a `zone: frontier` node. |
| `DATELESS_NOT_EMERGING` | `last_commit` is null but `status` is not `emerging`. |
| `DATELESS_NO_NOTE` | `last_commit` is null and there is no non-empty `note`. |
| `NO_LINKS` | A node has an empty `links` array. |
| `BLURB_TOO_LONG` | `blurb` exceeds 90 characters (CONTEXT.md section 7). |
| `ORPHAN_NODE` | A node claims no tracks. |

**Track integrity**

| Code | Rule |
| --- | --- |
| `UNKNOWN_PLACED_NODE` | An act or branch places an id that is not in the registry. |
| `PLACED_OFF_TRACK` | A placed node's `tracks` array does not include the track placing it. |
| `UNPLACED_NODE` | A node claims a track but appears nowhere in that track. |
| `DUPLICATE_PLACEMENT` | A node appears twice in the same track. |
| `PREREQ_AFTER` | A node is placed at or before a node it requires, in reading order. |
| `PREREQ_OFF_TRACK` | A placed node requires a node absent from that whole track. |
| `ACT_T_UNSORTED` | An act's `nodes` are not in ascending `t` order. |
| `UNKNOWN_ANCHOR` | A branch's `anchor` is not a known node id. |
| `ANCHOR_NOT_ON_TRACK` | A branch's anchor is not placed on the track that owns it. |
| `UNKNOWN_BRANCH_ACT` | A branch's `act` names no act in its track. |
| `BRANCH_NODE_NOT_FRONTIER` | A node placed on a branch is not `zone: frontier`. |
| `FRONTIER_ON_MAIN_PATH` (warning) | A `zone: frontier` node is placed in an act, not a branch. |
| `TRACK_KEY_MISMATCH` | A track's `id` does not equal its key in `tracks`. |
| `FOUNDATIONS_PREFIX` | A track's first act does not open with `foundations`, in order. |
| `EMPTY_ACT` (warning) | An act places no nodes. |

## Acceptance criteria

A stranger can verify each of these without asking me.

1. `npm install` completes with exactly these runtime and dev dependencies and no others:
   `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
   `@types/react-dom`.
2. `npm run build` exits 0 and writes `dist/`. It runs `validate:data` first, so a registry
   that fails validation fails the build rather than the browser.
3. `npx tsc --noEmit` exits 0.
4. `npm run validate:data` exits 0 and prints a summary naming the node count, track count,
   and issue count. It requires Node >= 22.6 for `--experimental-strip-types`, declared in
   `engines`.
5. `src/types.ts` contains no executable statements — types and interfaces only.
6. `src/data/validate.ts` imports nothing from `src/data/registry.ts`, imports no JSON, and
   never throws: feeding it `null, null` returns `ok: false` with at least one `BAD_ROOT`
   issue rather than crashing.
7. Every rule code in the tables above appears in `validate.ts`.
8. Running the validator against the real `data/*.json` produces zero errors and zero
   warnings.
9. Corrupting a copy of the data provokes the matching code. Verified for at least:
   `DANGLING_REQUIRE`, `PREREQ_AFTER`, `DATELESS_NO_NOTE`, `BLURB_TOO_LONG`, `BAD_URL`,
   `PLACED_OFF_TRACK`, `BRANCH_NODE_NOT_FRONTIER`, `FOUNDATIONS_PREFIX`.
10. `registry.orderedNodeIds('game')` returns 38 ids; `app` 43, `portfolio` 48, `media` 41 —
    matching each track's node count in `nodes.json`.
11. `registry.getNode('no-such-id')` throws rather than returning `undefined`.
12. No file outside `theme.css` contains a hex colour. `theme.css` does not exist yet,
    therefore no file in the repo contains a hex colour.
13. No CSS file, no `style` attribute, and no `className` is introduced by this spec.
14. No prose describing what any indexed tool does appears in any file this spec creates. The
    registry is pointers only.
15. `data/nodes.json` and `data/tracks.json` are byte-identical to their state at commit
    `a787113`.

## Edge cases the implementation must survive

- Empty `nodes` array, empty `tracks` object — validator reports, does not crash.
- A track with a single act holding a single node.
- A node with `requires: []` and a node required by nothing.
- A branch with exactly one placed node (`frontier-mcp` in the `game` track is one).
- A node with `repo`, `stars` and `last_commit` all null (39 of 67 are).
- A title of 26 characters and a blurb of 85 — the current maxima — must pass.
