# BACKLOG.md — flat ordered task checklist

One line per task. `- [ ]` open, `- [~]` claimed, `- [x]` done. Tasks name the spec they
belong to. Work is claimed from the top. Noticed-but-not-done work gets appended to the
bottom rather than done inline.

`State of the project.md` is the spec-level board; this file is the task-level one.

---

## Spec 01 — Types, schema, and data loading

- [x] T001 — Put the repo under git and commit the Phase A files
- [x] T002 — Write `specs/spec-01-schema.md`
- [x] T003 — Minimal toolchain: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- [x] T004 — `src/types.ts` and `src/constants.ts`
- [x] T005 — `src/data/order.ts` — one definition of a track's reading order
- [x] T006 — `src/data/validate.ts` — 32 rule codes, pure and total
- [x] T007 — `src/data/registry.ts` — loader and indexes
- [x] T008 — `scripts/validate-data.ts` and wire it into `npm run build`
- [x] T009 — `src/main.tsx` unstyled smoke test
- [x] T010 — Verify: build, typecheck, 45-case corruption suite, browser load

## Spec 02 — Visual shell: theme, type scale, app frame

- [ ] T011 — Write `specs/spec-02-shell.md`
- [ ] T012 — Add Tailwind, layout only, no palette tokens
- [ ] T013 — `src/theme.css` — every colour and type value as a custom property
- [ ] T014 — Serif display face plus mono, self-hosted, no CDN
- [ ] T015 — App frame: hairline rules, hard edges, generous space
- [ ] T016 — Replace the `src/main.tsx` smoke test with the real shell

## Noticed, not done

Appended by sessions that spotted work outside their one task. Do not do these inline.

- [ ] T017 — No favicon; the dev server logs a 404 for `/favicon.ico`. Spec 02 asset decision.
- [ ] T018 — `npm run build` emits a ~1 MB sourcemap. Decide in spec 12 whether to ship it.
- [ ] T019 — The hardcoded-colour build gate named in spec 12 does not exist yet. Until it
      does, "no hex outside `theme.css`" is checked by hand.
- [ ] T020 — `registry.tracks` and `registry.geometry` are readonly by type only, not frozen.
      Revisit if a spec ever mutates them by accident.
