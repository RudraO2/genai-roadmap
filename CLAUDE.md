# CLAUDE.md — rules for every session

`CONTEXT.md` is the constitution and outranks this file. Read it first, in full, every time.
Never edit it.

---

## The state rule — binding on every session

> **Read `State of the project.md` before you start anything.
> Update `State of the project.md` before you finish.**

No exception. Not for a one-line change, not for a question you think you already know the
answer to, not because a previous session in the same conversation already read it. Every
session starts cold and the file is the only thing that knows where the project actually is.

### Before starting

Read in this order:

1. `CONTEXT.md` — the constitution
2. `State of the project.md` — spec-level status; what is claimable right now
3. `BACKLOG.md` — task-level checklist
4. `PROGRESS.md` — what previous sessions did and learned
5. `BLOCKED.md` — do not retry anything listed here

Work only on a spec marked `READY FOR DEVELOPMENT`. If nothing is `READY FOR DEVELOPMENT`,
stop and say so — do not invent work, and do not start something `READY TO GO` whose
dependencies have not landed.

### On claiming

Set the spec to `IN PROGRESS` in `State of the project.md` and commit that single change
**before** doing any other work. A crashed session must not look like an unclaimed one.

Only one spec may be `IN PROGRESS` at a time.

### Before finishing

Update `State of the project.md`:

- Set the spec to `DONE` — but only if `npm run build` and `npx tsc --noEmit` both pass.
  If either fails, set it back to `READY FOR DEVELOPMENT` and write the reason in
  `BLOCKED.md`.
- Cascade: any spec whose dependencies are now all `DONE` moves `READY TO GO` →
  `READY FOR DEVELOPMENT`.
- Add one line to the change log at the bottom, dated.

Then update `PROGRESS.md` and `BACKLOG.md` as the Ralph loop prompt describes. The three
files are different altitudes and all three need touching:

| File | Altitude | When |
| --- | --- | --- |
| `State of the project.md` | Specs | Claim and completion |
| `BACKLOG.md` | Tasks | Every task |
| `PROGRESS.md` | Narrative | Every session |

### If you did no work

Say so, and leave `State of the project.md` untouched. A no-op session must not leave a spec
stuck at `IN PROGRESS`.

---

## Standing constraints

These override anything a spec seems to imply. They restate `CONTEXT.md`; if you find a
conflict, `CONTEXT.md` is right.

- **Store pointers, never content.** A node holds a URL and metadata about that URL. If a
  task asks you to write an explanation of how a tool works, the task is wrong — log it to
  `BLOCKED.md` and move on.
- **No backend, no auth, no database, no server routes.** localStorage plus JSON export is
  the entire persistence story.
- **No new npm dependencies** beyond Vite, React, TypeScript and Tailwind. If one seems
  necessary, log it to `BLOCKED.md` and pick the next task.
- **Every colour and type value lives in `theme.css`** as a custom property. Zero hardcoded
  hex anywhere else.
- **Re-read section 8 of `CONTEXT.md` before writing any UI.** Gradient, glow,
  glassmorphism, emoji icon, bento grid, default Tailwind palette token, or Inter means you
  have violated the constitution. Tailwind is for layout only.
- **Never add a URL to `nodes.json` that you have not fetched successfully in this session.**
  A hallucinated repo is worse than a missing node.
- **One task per session.** Notice other work, append it to `BACKLOG.md`, do not do it.

## Definition of done

- `npm run build` passes
- `npx tsc --noEmit` passes
- No hardcoded colour outside `theme.css`
- No node in `nodes.json` with an unverified URL
- `State of the project.md`, `BACKLOG.md` and `PROGRESS.md` all updated
- Committed with a message naming the task id

## Repo map

| Path | What |
| --- | --- |
| `CONTEXT.md` | Constitution. Read fully, never edit. |
| `CLAUDE.md` | This file. Session rules. |
| `State of the project.md` | Spec-level status board. Read first, update last. |
| `BACKLOG.md` | Flat ordered task checklist. |
| `PROGRESS.md` | Per-session narrative log. |
| `BLOCKED.md` | Do not retry anything here. |
| `seeds.md` | The hand-written seed list Phase A started from. |
| `data/nodes.json` | The registry. 67 nodes. |
| `data/tracks.json` | Ordered node ids per track plus curve geometry. |
| `data/research-log.md` | What was rejected in Phase A and why. |
| `specs/` | Numbered spec files, one unit of work each. |
| `prompts/` | Bootstrap, Ralph loop, and sprite-generation prompts. |
