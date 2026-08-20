# CLAUDE.md — rules for every session

Read `README.md` first. It describes what this project is now.

`DESIGN.md` governs the visual language and must be re-read before writing any UI.
It is short, and it is the whole of the design constitution — there is no other
document to consult.

The earlier process documents (`CONTEXT.md`, `State of the project.md`, `BACKLOG.md`,
`PROGRESS.md`, `BLOCKED.md`, `seeds.md`, `specs/`, `prompts/`) described a different
version of this project — a serpentine SVG road with a walking character, and a
`nodes.json` / `tracks.json` registry. None of that exists. They were deleted rather
than kept as history, because a document describing a system that is gone is an
invitation to rebuild it by accident. Git history has them if they are ever wanted.
Do not restore them, and do not resurrect what they describe.

## Standing constraints

- **No backend, no auth, no database, no server routes.** `localStorage` plus JSON
  export is the entire persistence story.
- **No new npm dependencies** beyond Vite, React, TypeScript and Tailwind.
- **Every colour and type value lives in `src/theme.css`** as a custom property. Zero
  literals anywhere else. `npm run check:theme` enforces this.
- **Tailwind is for layout only.** Gradient, glow, glassmorphism, emoji icon, bento grid,
  default Tailwind palette token or Inter means you have violated the constitution.
- **Never add a URL to `data/roadmap.json` that you have not fetched successfully in this
  session.** If a host is unreachable, either use its stable site root with
  `"verified": false` — the validator caps those at two path segments — or use a search
  query instead. A hallucinated repo is worse than a missing node.
- **A quest carries instructions, not content.** Steps that say what to do at the far end
  of a link; never a copy of what is at the far end of the link.
- **Every quest needs at least two steps, one finish condition, one link and one search.**
  The validator rejects anything less, because a node without them is a bookmark.

## Definition of done

- `npm run build` passes — all five gates
- `npx tsc --noEmit` passes
- No hardcoded colour outside `src/theme.css`
- No unverified deep link in `data/roadmap.json`
- The change was actually looked at in a browser, not only compiled
