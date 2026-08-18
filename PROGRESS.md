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
