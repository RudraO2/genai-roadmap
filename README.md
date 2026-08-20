# The Gen AI Roadmap

An interactive, graph-shaped learning roadmap for generative AI. Pick a path, and the
map tells you what to do, how to do it, when you are allowed to do it, and exactly where
to go to learn it.

Static site. React + TypeScript + Vite. No backend, no account, no database — progress
lives in `localStorage` and exports to a JSON file you own.

## What it actually is

**Four paths**, each a different job:

| Path | Finish line |
| --- | --- |
| AI Explorer | Run your real work through AI every day and know when not to trust it |
| AI Engineer | Ship a retrieval-backed, tool-using, evaluated LLM app |
| Model Builder | Write a transformer from scratch, then fine-tune a real one |
| Creative Studio | Produce a finished piece with a pipeline you can repeat |

**94 quests** across **17 stages**. A quest is not a bookmark. Each one carries:

- a **mission** — one imperative sentence naming the thing to do
- **why now**, so the ordering is an argument rather than an assertion
- **steps** — 4-6 concrete actions, 444 of them across the registry
- **done when** — observable finishing conditions, not "understand X"
- **links** — 196 of them, 182 fetched successfully while the registry was written
- **searches** — 179 live Google, YouTube and GitHub queries, which cannot rot. Every
  quest carries at least two, and the well-known courses that live behind hosts this
  build could not reach — Google's crash courses, DeepLearning.AI, Microsoft Learn,
  Kaggle, the Hugging Face courses — are reached through queries that name them rather
  than through a URL nobody checked

**A graph, not a line.** Quests connect by prerequisite, so parallel work looks parallel:
retrieval and agents are genuinely independent branches, side quests hang off the spine,
and capstones sit where several threads converge. Stages are drawn as bands; edges are
routed orthogonally between them and light up as you complete their source.

**States that answer "when".** A quest is `ready` when every prerequisite is done,
`locked` otherwise. Locked never means hidden — a locked card is dimmed, still readable
and still opens, and it names what it is waiting for. One banner at the top always names
the single next thing to do.

**A map you can stand in.** Onboarding is two questions and a button, all on one screen.
Each path then keeps its own colour for as long as you are on it — the ground the map is
drawn on, the sticky bar at the top, the stage rules and the dialog's spine — so Creative
Studio and AI Engineer are visibly different places rather than the same grid with
different words in it. The bar names the path, the level, the stage you are standing in
and how far along you are, and it does not scroll away. Under it, a stage stepper marks
what is cleared, what you are in, and what is still ahead, and jumps to any of them.

**One stage at a time, by default.** Fifty-nine quests arriving at once is a wall, not a
map. Every stage except the one in play opens as a header — its title, its kicker, its
tally — and expands on a click. `All stages` puts the whole thing back. Quests remember
having been opened, and the last one you opened stays marked after you close it, so
shutting a panel never costs you your place.

**The level you gave does something.** Quests below it are marked review; quests two
levels above it are marked stretch. One level up is not flagged, because one level up is
what a roadmap is for. Nothing is ever hidden or disabled by the answer.

## Running it

```
npm install
npm run dev        # http://localhost:5173
npm run build      # data gate → theme gate → tsc → vite build → output gate
```

`npm run build` runs five gates in sequence. All five must pass:

| Gate | What it enforces |
| --- | --- |
| `validate:data` | The registry's shape, and its graph: no dangling edges, no cycles, no grid collisions, and — per path — no quest whose prerequisite is missing, later, or below it |
| `check:theme` | No colour or type literal outside `src/theme.css`, no gradients, no blur, no unknown token |
| `tsc --noEmit` | Types |
| `vite build` | The bundle |
| `check:output` | Relative asset paths, no sourcemaps, no banned Tailwind utility survived into the CSS |

## The data model

Everything is `data/roadmap.json`. Three arrays:

- `paths` — id, title, tagline, goal, and the ordered `stages` it walks
- `stages` — id, title, kicker, summary. A stage belongs to as many paths as it likes;
  that is how quests are shared without being duplicated
- `nodes` — the quests. `stage` decides which paths show it, `col`/`row` place it in that
  stage's grid, and `requires` is the edge list

Adding a quest means adding one node. The validator will refuse it if its prerequisites
are missing, if it sits in an occupied cell, or if any path would show it before something
it depends on.

### Links, and why some are marked unverified

Every link carries `verified`. `true` means the URL was fetched successfully while the
registry was being written; those also record a star count. `false` means the build
environment's egress policy could not reach that host — it allows `github.com` and little
else — so the link is restricted to a **stable site root**, never a deep path that could
have been guessed wrong. The validator enforces that rule: an unverified link deeper than
two path segments is a build error.

Anything that would need a deep non-GitHub URL is a **search query** instead. A search URL
is built from the query at render time, so it always resolves, and it is honest about
being a search rather than a promise that a specific page exists.

**Never add a URL you have not fetched.** A hallucinated repo is worse than a missing one.

## Design

`DESIGN.md` is the whole of the design constitution and is worth reading before
touching any UI: paper ground, near-black ink, hard registration offsets rather than
shadows, three typefaces with three jobs, colour assigned from data and never from
position in a list, motion only to show a state change. No gradients, no glow, no
glassmorphism, no emoji icons. Tailwind is for layout only — `src/index.css` deletes the
theme namespaces that would let a banned utility exist at all.

Colour runs on two channels that never mix. On a quest box it says what kind of work it
is: white is core, blue is an optional side quest, lime is something you build, orange is
a capstone. On the chrome around it — ground, bar, stage rules, dialog spine — it says
which of the four paths you are on. The action accent means done, ready or go, and it
means that on all four paths.

## Repo map

| Path | What |
| --- | --- |
| `data/roadmap.json` | The registry. Paths, stages, quests, edges, links. |
| `src/data/validate.ts` | The one validator, run by the app and by the build. |
| `src/data/roadmap.ts` | Loader and indexes. Nothing else parses the JSON. |
| `src/data/layout.ts` | The graph layout: bands, boxes, routed edges. Pure. |
| `src/data/state.ts` | Everything derived from the completed set, in one place. |
| `src/components/` | Picker, path bar, stage rail, map, quest dialog, list view, controls. |
| `src/theme.css` | Every colour and type value in the project. |
| `DESIGN.md` | The design constitution. All of it. |

There is no other documentation, on purpose. An earlier set of process documents
(`CONTEXT.md`, `BACKLOG.md`, `PROGRESS.md`, `specs/` and the rest) described a version
of this project that no longer exists, and was deleted rather than kept — git history
has it.
