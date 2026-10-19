# The Gen AI Roadmap

Learn AI one useful step at a time. A free, static learning guide built with React,
TypeScript, and Vite. Live at https://rudrao2.github.io/genai-roadmap/.

## The learner experience

- **Home:** a plain-language introduction and one recommended starting action.
  Returning learners can continue their saved path.
- **Courses:** four paths described by what learners can do with them. Chapter
  outlines expand on request. There is no mandatory setup questionnaire; beginners
  can start immediately. Experienced learners can optionally set their level.
- **My learning:** one next lesson, a progress bar, and a chapter list. Only the
  current chapter expands initially. Study-session planning, search, filters, the
  full desktop graph, and level settings are secondary disclosures.
- **Lessons:** one activity instruction at a time, an external learning resource,
  a completion checklist, and a clear next-lesson action. Additional resources and
  searches expand on request. Lessons with prerequisites can be previewed and
  explain which lessons to complete first.

| Path | What you learn |
| --- | --- |
| AI Explorer | Use AI in everyday life, get better answers, and check its work |
| AI Engineer | Build useful AI apps, starting with code and moving to deployment |
| Model Builder | Understand, build, and train models |
| Creative Studio | Make images, video, and voice with a repeatable creative process |

The registry contains **94 activities across 17 shared chapters**, with 196 external
links and concrete instructions. These are curated learning activities pointing to
external material, not hosted video courses. Shared lessons stay completed when a
learner changes paths.

## Running it

Requires Node 22.6 or later.

```sh
npm ci
npm run dev
npm run build
```

`npm run build` runs all required gates: registry validation, theme validation,
TypeScript, 60 tests, Vite production build, and output validation. Tests use
Node's own test runner; no test-framework dependency is needed.

## Routes and persistence

- `#/` — home
- `#/courses` — course browser
- `#/explorer` — a course (also `engineer`, `builder`, and `creator`)
- `#/engineer/rag-pipeline` — a shareable lesson

The hash router works on GitHub Pages without server rewrites. Shared lesson links
open immediately with beginner defaults when no level has been saved. Browser
Back follows lesson history; Close and Back to course return directly to the course.

There is **no backend, authentication, or database**. Progress, starting level, and
visited lessons use the existing browser storage keys. Save/restore progress and
the printable course checklist are available under My progress. JSON export files
keep their existing format. In a browser that blocks storage, session state still
works but cannot survive a reload.

Progress percentage is weighted by activity XP, while chapter counters count
completed lessons. XP and ranks remain internal to the registry and graph; they
do not compete with the main next-lesson action.

## Content and architecture

`data/roadmap.json` is the single registry. Paths contain ordered chapter IDs,
chapters contain activities, and activities contain prerequisite IDs, estimated
time, instructions, finishing conditions, resources, and search queries. The
validator rejects missing prerequisites, cycles, and incompatible graph placement.

Never add an external resource URL without fetching it successfully. An unreachable
host must use a stable shallow root with `verified: false`, or a search query.
Existing verification flags describe the registry author's checks, not continuous
monitoring. Activities point to learning material rather than reproducing it.

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Screen routing and shared learner state |
| `src/components/Home.tsx` | First visit and returning-learner home |
| `src/components/PathPicker.tsx` | Course browser and optional level setting |
| `src/components/RoadmapScreen.tsx` | Learning dashboard and secondary map tools |
| `src/components/QuestPanel.tsx` | Guided lesson, completion, and next lesson |
| `src/data/state.ts` | Prerequisites, recommendations, progress, and chapter tallies |
| `src/data/route.ts` | Validated shareable hash routes |
| `src/data/session.ts` | Study-session recommendations that fit a time budget |
| `src/data/portability.ts` | Existing JSON progress format and validation |
| `src/theme.css` | All colors, typography, and shared design tokens |
| `src/styles/learning.css` | Learner-facing UI and responsive layouts |
| `DESIGN.md` | Design principles and enforced constraints |

GitHub Actions builds `main` and deploys `dist/` using `.github/workflows/pages.yml`.
Vite keeps asset paths relative so GitHub Pages project-path hosting works.
