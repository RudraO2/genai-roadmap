# CLAUDE.md — rules for every session

Read `README.md` first. It describes what this project is now.

`CONTEXT.md` section 8 still governs the visual language and must be re-read before
writing any UI. The rest of `CONTEXT.md`, and the process documents it refers to
(`State of the project.md`, `BACKLOG.md`, `PROGRESS.md`, `BLOCKED.md`, `specs/`), describe
the earlier single-path iteration and are kept as history. Do not treat them as a
worklist, and do not resurrect the `nodes.json` / `tracks.json` registry they describe.

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
