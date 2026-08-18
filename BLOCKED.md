# BLOCKED.md — do not retry anything listed here

One entry per dead end, with the date and what actually failed. A session that finds its
task listed here skips it and takes the next one.

Entries are also the right home for a spec that asked for something `CONTEXT.md` forbids —
prose about a tool, a backend route, a new npm dependency. Log it and move on rather than
arguing with the constitution.

---

## Nothing is blocked

As of 2026-08-18, after spec 01. No task has been abandoned and no dependency has been
refused.

---

## Near misses worth knowing about

Not blockers — these were resolved — but they cost time and would cost it again.

- **2026-08-18 — `tsconfig.node.json` as a referenced project.** `tsc` fails with
  `TS6310: Referenced project ... may not disable emit`, because every project here sets
  `noEmit`. Resolved by deleting it and adding `vite.config.ts` to the single
  `tsconfig.json` include. Do not reintroduce the split-project layout.
- **2026-08-18 — `@types/node` for `scripts/validate-data.ts`.** Not added:
  `CONTEXT.md` section 10 caps dependencies at Vite, React, TypeScript and Tailwind.
  Resolved with `scripts/node-shims.d.ts`, which declares only `readFileSync`,
  `fileURLToPath`, `dirname`, `join` and `process.exit`. If a later spec needs materially
  more of the Node API, that is a real dependency question — log it here first.
