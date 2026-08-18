# State of the project

**Single source of truth for what is built, what is next, and what is blocked.**

Read this before starting any work. Update it before finishing any work. That rule is
binding on every session and is restated in `CLAUDE.md`.

This file tracks **specs** — units of work. `BACKLOG.md` tracks **tasks** inside a spec,
and `PROGRESS.md` records what each session actually did. Three files, three altitudes.
Do not merge them.

`CONTEXT.md` outranks this file. If they disagree, `CONTEXT.md` wins and this file is wrong.

---

## Status legend

| State | Meaning | Who moves it |
| --- | --- | --- |
| `SPEC PENDING` | Titled and scoped here, but the spec file in `specs/` does not exist yet. Not claimable. | Whoever writes the spec |
| `READY TO GO` | Spec file written and approved. Blocked — at least one dependency is not `DONE`. | Automatic, when a dependency lands |
| `READY FOR DEVELOPMENT` | Spec written, every dependency `DONE`. Claimable right now. | Automatic, when the last dependency lands |
| `IN PROGRESS` | A session has claimed it. Only one spec may be `IN PROGRESS` at a time. | The claiming session |
| `DONE` | Every acceptance criterion in the spec verified. `npm run build` and `npx tsc --noEmit` both pass. | The finishing session |

A spec may only move to `DONE` with a green build. Anything less goes back to
`READY FOR DEVELOPMENT` and the reason goes in `BLOCKED.md`.

---

## Phase status

| Phase | What | State |
| --- | --- | --- |
| A | Research the node registry → `data/nodes.json`, `data/tracks.json` | `DONE` — 2026-08-18 |
| B | Write the specs → `specs/*.md` | `IN PROGRESS` — titles approved, files not written |
| C | Build the backlog → `BACKLOG.md` | `SPEC PENDING` — blocked on B |

---

## Spec board

| # | File | State | Depends on |
| --- | --- | --- | --- |
| 01 | `specs/spec-01-schema.md` | `SPEC PENDING` | — |
| 02 | `specs/spec-02-shell.md` | `SPEC PENDING` | 01 |
| 03 | `specs/spec-03-intake.md` | `SPEC PENDING` | 01, 02 |
| 04 | `specs/spec-04-path.md` | `SPEC PENDING` | 01, 02 |
| 05 | `specs/spec-05-cards.md` | `SPEC PENDING` | 01, 04 |
| 06 | `specs/spec-06-panel.md` | `SPEC PENDING` | 01, 05 |
| 07 | `specs/spec-07-character.md` | `SPEC PENDING` | 04 |
| 08 | `specs/spec-08-progress.md` | `SPEC PENDING` | 04, 05, 07 |
| 09 | `specs/spec-09-frontier.md` | `SPEC PENDING` | 04, 05 |
| 10 | `specs/spec-10-navigation.md` | `SPEC PENDING` | 04, 08, 09 |
| 11 | `specs/spec-11-portability.md` | `SPEC PENDING` | 08 |
| 12 | `specs/spec-12-ship.md` | `SPEC PENDING` | 01–11 |

---

## 01 — Types, schema, and data loading

**State:** `SPEC PENDING`  **Depends on:** nothing

Defines `Node`, `Track`, `Act`, `Branch`, `Link`, `Level`, `Zone`, `Status`, `Kind` in
`src/types.ts`, plus a runtime validator and loader for `data/nodes.json` and
`data/tracks.json`. Every other spec imports from here and none of them redeclares a shape.

The validator is not decoration. It enforces what the registry generator already enforced:
no dangling `requires`, no main-zone node depending on a frontier node, no node placed on a
track before its prerequisite, every date-less node `emerging` and carrying a `note`.

**Watch for:** `status: "emerging"` is the majority state (42 of 67 nodes). It means
"freshness unknown", not "risky". Do not type it as an error condition.

---

## 02 — Visual shell: theme, type scale, app frame

**State:** `SPEC PENDING`  **Depends on:** 01

Vite + React + TypeScript scaffold. One `theme.css` holding every colour and type custom
property so the whole aesthetic is swappable in one file. Serif display face plus mono for
all structural text. Hairline rules, hard edges, generous emptiness.

Deliberately early. The aesthetic must be judgeable before a single system is built, because
rebuilding the look after the map exists is far more expensive than rebuilding it now.

**Watch for:** `CONTEXT.md` section 8 is a hard constraint, not a mood board. No gradients,
no glassmorphism, no glow shadows, no emoji icons, no default Tailwind palette tokens, no
Inter. Tailwind is for layout only.

---

## 03 — Intake: track and level

**State:** `SPEC PENDING`  **Depends on:** 01, 02

One screen: pick a track (game / app / portfolio / media), pick a level (beginner /
intermediate / advanced). Choice persists to localStorage. Re-entry skips the screen and
offers a way back to change it.

First real exercise of the shell with real data from the registry.

---

## 04 — The path engine

**State:** `SPEC PENDING`  **Depends on:** 01, 02

The load-bearing spec. One SVG `<path>` element per act. Node position is
`path.getPointAtLength(total * t)` — nodes never store x/y. A `usePathPoint(t)` hook returns
`{ x, y, angle }`, sampling `t + 0.001` and `Math.atan2`-ing the delta for facing.

Ships a bare path with plain dots on purpose. No cards, no character, no styling beyond the
theme. Ugly is correct here.

**Watch for:** this one element later serves four systems — placement, fog of war, character
position, completed glow. If any later spec computes a position a second way, the fog will
not line up with the nodes and the bug will be near-impossible to see. Reject any second
implementation.

---

## 05 — Node cards in the negative-space pockets

**State:** `SPEC PENDING`  **Depends on:** 01, 04

Cards sit in the pockets the S-curve bends create, alternating sides from the `side` field
in `tracks.json`. Card shows title, blurb, level, and a completion affordance.

Also owns level filtering: nodes below the learner's chosen level collapse to a hairline
stub. Collapsed, never deleted — the learner can always expand.

---

## 06 — The node panel: pointers, never content

**State:** `SPEC PENDING`  **Depends on:** 01, 05

Opening a node reveals its links grouped by `kind` (repo / docs / video / thread / article /
playground), its star count, last commit date, `status`, and `note`.

**Watch for:** the hard rule from `CONTEXT.md` section 3. This panel renders metadata about
a URL and links out. It never explains what the tool is or how to use it. If a task asks for
prose about a tool, that task is wrong — log it to `BLOCKED.md` rather than writing it.

---

## 07 — The character

**State:** `SPEC PENDING`  **Depends on:** 04

`<Character t={0.42} facing="right" variant={{ body, hair, outfit }} />`. Code-drawn
geometric placeholder with a two-state bob. Position comes from the path engine, never from
its own maths.

**Watch for:** the props are frozen by `prompts/00-antigravity-assets.md`. Sprite sheets
arrive later and must slot in behind this exact interface. Getting the signature right now
turns a future refactor into a one-file swap. Do not block on assets.

---

## 08 — Progress and fog of war

**State:** `SPEC PENDING`  **Depends on:** 04, 05, 07

Mark a node complete or incomplete; persist to localStorage. Fog of war is
`stroke-dasharray` and `stroke-dashoffset` on the same path from spec 04. Completed glow is
a second path layered above, dash-clipped to progress. Character `t` tweens toward the
progress frontier.

**Watch for:** "completed glow" here means a second stroke, not a `box-shadow` with colour.
Section 8 bans glow shadows and neon halos outright.

---

## 09 — The frontier branch

**State:** `SPEC PENDING`  **Depends on:** 04, 05

Frontier nodes render as spurs off their `anchor` node, using the branch path geometry in
`tracks.json`. Visually distinct from the main path and explicitly marked unproven. 23 of
67 nodes live here.

Also renders demotion: a node with no commits in 12 months greys out and is marked dormant,
kept visible with its successor linked if one is known. Dead tools are useful information.
Nothing is ever deleted.

---

## 10 — Act navigation and the overview map

**State:** `SPEC PENDING`  **Depends on:** 04, 08, 09

Move between acts. Each act is its own serpentine screen. A zoomed-out overview chains the
acts into one map so the whole road is legible at once.

Act counts per track: game 7, app 6, portfolio 8, media 8.

---

## 11 — Progress portability

**State:** `SPEC PENDING`  **Depends on:** 08

Export progress to a JSON file, import it back, reset it. This is how a learner moves
between devices without an account. It is the entire sync story and it must stay that way.

**Watch for:** no backend, no auth, no database. If a task here starts describing a server
route, it has violated the constitution.

---

## 12 — Ship: build gates and GitHub Pages

**State:** `SPEC PENDING`  **Depends on:** 01–11

`npm run build` and `npx tsc --noEmit` wired as gates. A script that fails the build on any
hardcoded colour outside `theme.css`. GitHub Pages base path and 404 handling for a static
deploy.

---

## Deferred to v2 — do not build

Leaderboards, peer verification, guilds, social streaks, proof-of-work submission. All need
a backend. v1 is the map only. If one of these appears in a task, the task is wrong.

---

## Change log

Newest first. One line per state change. Whoever changes a state writes the line.

- 2026-08-18 — Phase A `DONE`. Registry: 67 nodes, 44 main / 23 frontier, 98 URLs verified 200.
- 2026-08-18 — Registry revised: freshness rule applied literally, `core` 61 → 25, `emerging` 6 → 42.
- 2026-08-18 — Phase B opened. Twelve spec titles approved. All specs `SPEC PENDING`.
