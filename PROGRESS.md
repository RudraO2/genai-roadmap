# PROGRESS.md — per-session narrative log

Newest last. One entry per session. `State of the project.md` is the status board;
this file is the story of how it got there.

---

## Spec 01 — Types, schema, and data loading — 2026-08-18

**Did:** Put the repo under git (it was not a repository), then built the shared type
layer, a 32-rule registry validator, the loader, and the minimal Vite + React +
TypeScript toolchain. Wrote `specs/spec-01-schema.md` first, since no spec file existed.

**Decided:**

- The board was deadlocked. `State of the project.md` said a `SPEC PENDING` spec was not
  claimable, but no session was assigned to write spec files, so nothing could ever start.
  `prompts/02-ralph-loop.md` step 4 settles it: the claiming session writes the spec file.
  Updated the legend to say so rather than stopping with nothing delivered.
- Spec 01 owns the toolchain even though `State of the project.md` lists the scaffold under
  spec 02, because spec 01's definition of done is a passing `npm run build` and there was
  no build. The split is toolchain here, look there.
- Reading order got its own module, `src/data/order.ts`. The validator checks prerequisites
  against it and the loader hands the same order to the UI; two copies would let the map
  disagree with its own validation.
- Declared the five Node functions the CLI script needs in `scripts/node-shims.d.ts` instead
  of adding `@types/node`, keeping the dependency list at exactly what `CONTEXT.md` allows.

**Verified:** `npm run build` 0, `npx tsc --noEmit` 0, `npm run validate:data` 0 with
67 nodes / 4 tracks / 0 errors / 0 warnings. A 45-case corruption suite fires every one of
the 32 rule codes and confirms the validator never throws on garbage input. Loaded the app
in a real browser: `orderedNodeIds` returns 38 / 43 / 48 / 41, matching the per-track node
counts in `nodes.json`, and `getNode('no-such-id')` throws. Deliberately broke a `requires`
and confirmed `npm run build` exits 1, then restored the data and confirmed it is
byte-identical to commit `a787113`.

**Next iteration should know:** everything under "Next session should know" in the spec 01
notes in `State of the project.md`. The short version: `.ts` import extensions are
load-bearing, `types.ts` stays type-only with runtime values in `constants.ts`, spec 02
inherits this scaffold rather than creating one.

---

## Spec 02 — Visual shell: theme, type scale, app frame — 2026-08-18

**Did:** Picked up a claim already in progress (`03bc570 claim: spec 02` plus two `wip`
commits) with a clean working tree — a prior session had landed the spec file, vendored
fonts, `theme.css` tokens, and the Tailwind namespace resets in `index.css`, but had not
wired the `@tailwindcss/vite` plugin into `vite.config.ts` or written any component. Finished
the rest: `src/styles/base.css`, `src/styles/shell.css`, `Shell.tsx`, `Section.tsx`,
`App.tsx`, `main.tsx`, `assets.d.ts`, and the `index.html` meta/icon additions.

**Decided:** `Section`'s title renders at `--size-display`, not the same-named `--size-title`
— the latter fell short of acceptance criterion 11's 3× size-jump floor on real viewports.
Full reasoning and every other decision is in the spec 02 session notes in
`State of the project.md`; not duplicating it here.

**Verified:** `npm run build` and `npx tsc --noEmit` both exit 0. Grepped for every banned
pattern in `CONTEXT.md` section 8 across `src/`, `index.html`, and the built `dist/` CSS —
none found. Loaded the app in a real Chrome tab (`chrome-devtools` MCP): no console errors,
tab-focus produces a hard 2px accent outline on the skip link, 360px viewport has zero
horizontal overflow with the masthead meta wrapping under the wordmark, title/body font-size
ratio measured 3.23× in the live DOM, and `.shell` holds at `--frame-max` (1248px) on a
2560px viewport instead of growing unbounded.

**Next iteration should know:** everything under "Next session should know" in the spec 02
notes in `State of the project.md`. The short version: `--size-title` is intentionally
unused so far (reserved for a later sub-heading), `Shell` reads `registry`/`registryWarnings`
directly for its colophon line, and the current `.track-row` styling is for a *static* index
— spec 03 will very likely need to merge in interactive states rather than inherit it as-is.
