# Spec 11 — Progress portability

**Depends on:** 08 (`data/progress.ts` storage, `hooks/useProgress.ts`, `ProgressContext`),
and by proximity 03 (`data/intake.ts`, `hooks/useIntake.ts`) for the intake half of the file

## Goal

Give the learner their progress as a file. One control opens a panel that does three things
and nothing else: **export** writes a JSON file to disk, **import** reads one back, **reset**
clears the device. That is the entire sync story — `CONTEXT.md` section 10 allows
localStorage plus JSON export/import and forbids a backend, an account, or a database, so
there is nothing else to build here and nothing else may be added later.

The file carries the completed node ids and the intake (track and level), because moving
device means landing on the same map at the same level, not just with the same ticks. The
parser is total: a truncated file, someone else's JSON, a hand-edited array or a future
version must produce a stated refusal, never a crash and never a half-applied import.

## In scope

- `src/data/portability.ts` — new, React-free and DOM-free. The file's shape, one builder,
  one serializer, one total parser, and the export filename.
- `src/data/intake.ts` — extract the existing inline `track` / `level` validation into an
  exported `parseIntake(value: unknown): IntakeState | null` and call it from `loadIntake`.
  The importer validates an intake the same way storage does, from one definition.
- `src/hooks/useProgress.ts` — a `replaceProgress(ids)` that swaps the whole set, so an
  import is one state write and one storage write rather than a loop of toggles.
- `src/components/ProgressPanel.tsx` — new. A controlled native `<dialog>`, the same
  pattern as `NodePanel` (sync `showModal()` / `close()` to an `open` prop, funnel `Escape`
  and the close button through one `onClose`). Holds the three controls, the reset's
  confirm step, and one status line.
- `src/App.tsx` — owns the panel's open state, renders the control in the masthead of both
  screens (picker and map), and wires import to `replaceProgress` + `setIntake` and reset to
  `resetProgress`.
- `src/styles/portability.css` — new stylesheet for the panel's own classes, registered in
  `src/index.css`.

## Out of scope

- **A backend, an account, a share link, or a server round trip.** Section 10. If a task
  here starts describing an upload endpoint, the task is wrong.
- **Merging two progress files.** Import replaces the device's set. A merge needs a rule for
  what the newer truth is, and the file carries no per-node timestamps to decide with.
  The panel says so before the learner picks a file.
- **Exporting the registry, a track, or anything about a node.** The file carries ids the
  learner has ticked, never node content — `CONTEXT.md` section 3 holds here too.
- **Persisting the viewed act (T106).** Storage lives here, but the act view is spec 10's
  state and a stored act id would have to survive importing another track's file. Left open.
- **Import from a URL, drag-and-drop, or the clipboard.** One `<input type="file">`.
- **A second progress store.** `replaceProgress` writes through the same effect
  `useProgress` already persists with; nothing else touches `roadmap:progress:v1`.

## Files

| File | Change |
| --- | --- |
| `src/data/portability.ts` | New — `ProgressFile`, `buildProgressFile`, `serializeProgressFile`, `parseProgressFile`, `exportFilename`, the size cap |
| `src/data/intake.ts` | New export `parseIntake`; `loadIntake` calls it |
| `src/hooks/useProgress.ts` | New `replaceProgress` on `UseProgress` |
| `src/components/ProgressPanel.tsx` | New — the `<dialog>` with export / import / reset |
| `src/App.tsx` | Panel open state, masthead control on both screens, import and reset wiring |
| `src/styles/portability.css` | New |
| `src/index.css` | One `@import` line |

No new dependency. Nothing else in `src/` changes.

## Interfaces

```ts
// src/data/portability.ts

/** Bumped only when the shape changes incompatibly. A file from a future version is refused. */
export const PROGRESS_FILE_VERSION = 1

/** What lands on disk. `kind` is the discriminator that makes "this is not our file" cheap. */
export interface ProgressFile {
  kind: 'interactive-roadmap-progress'
  version: number
  /** ISO instant, informational only — nothing reads it back to order two files. */
  exported: string
  /** Null when the learner exported before finishing intake. */
  intake: IntakeState | null
  completed: string[]
}

/** Refused before it is read: a misclicked video must not freeze the tab. */
export const MAX_PROGRESS_FILE_BYTES = 4 * 1024 * 1024

export type ImportProblem =
  | 'unreadable'           // not JSON at all
  | 'too-large'            // far bigger than any progress file; refused unread
  | 'not-a-progress-file'  // parses, but is not one of ours
  | 'unsupported-version'  // ours, from a version this build does not know
  | 'empty'                // ours, well-formed, and carries nothing to apply

export interface ImportedProgress {
  completed: ReadonlySet<string>
  intake: IntakeState | null
}

export type ImportResult =
  | { ok: true; value: ImportedProgress }
  | { ok: false; problem: ImportProblem }

export function buildProgressFile(
  completed: ReadonlySet<string>,
  intake: IntakeState | null,
  now?: Date,
): ProgressFile

export function serializeProgressFile(file: ProgressFile): string

/** Total: every input returns a result. Never throws, never partially applies. */
export function parseProgressFile(text: string): ImportResult

/** `roadmap-progress-2026-08-18.json` */
export function exportFilename(now?: Date): string

/** One sentence per problem, for the panel's status line. */
export const IMPORT_PROBLEM_MESSAGE: Readonly<Record<ImportProblem, string>>
```

```ts
// src/data/intake.ts
export function parseIntake(value: unknown): IntakeState | null

// src/hooks/useProgress.ts
export interface UseProgress {
  completed: ReadonlySet<string>
  toggle: (id: string) => void
  replaceProgress: (ids: ReadonlySet<string>) => void
  resetProgress: () => void
}

// src/components/ProgressPanel.tsx
export interface ProgressPanelProps {
  open: boolean
  onClose: () => void
  completed: ReadonlySet<string>
  intake: IntakeState | null
  /** Applies an accepted file. Returns nothing; the panel reports what it applied. */
  onImport: (imported: ImportedProgress) => void
  onReset: () => void
}
```

## Behaviour

- **Export.** Builds the file from the current set and intake, serializes it with two-space
  indentation and a trailing newline (it is a file a person may open), and hands it to the
  browser through a `Blob` + object URL + a synthetic anchor click, revoking the URL after.
  Exporting nothing is allowed — an empty set is a legitimate state to carry to a new device.
- **Import.** `<input type="file" accept="application/json,.json">` → a size check against
  `MAX_PROGRESS_FILE_BYTES`, refused before the read → `file.text()` → `parseProgressFile`.
  On `ok`, the completed set is replaced wholesale, and the intake is applied only when the
  file carries a valid one. On failure, nothing is applied and the status line states which
  of the five problems it was. The input is cleared after every attempt so picking the same
  file twice re-runs it.
- **Reset.** Two steps in place: `Reset progress` arms, `Confirm reset` clears. No native
  `confirm()`. The armed state disarms when the panel closes, so a stale arm cannot survive.
- **Unknown ids survive.** The parser keeps ids the registry does not know, for the same
  reason `loadCompleted` does: section 6 never deletes a node, and a file may predate or
  postdate this build's registry.

## Visual

`CONTEXT.md` section 8. The panel reuses the `NodePanel` surface language — `--surface-raised`
on a hairline `--rule` border, hard edges, mono for every structural word, the serif only for
the panel's own title, `color-mix()` backdrop with no blur. Accent appears on hover, on focus,
and on the armed reset control — "here", not decoration. No icon of any kind, no emoji, no
second colour, no gradient, no shadow. The three actions are rows separated by hairlines, each
with a mono label, its one-line consequence in `--text-secondary`, and its control.

## Acceptance criteria

1. `npm run build` and `npx tsc --noEmit` both exit 0.
2. `src/data/portability.ts` imports nothing from `react` and touches no DOM API.
3. A file larger than `MAX_PROGRESS_FILE_BYTES` is refused without being read, and says so.
4. `parseProgressFile` returns a result for every input and throws for none, including `''`,
   `'null'`, `'[]'`, `'{}'`, truncated JSON, a JSON array of ids, another app's JSON, a file
   with `version: 999`, a file whose `completed` holds numbers and objects, and one whose
   `intake.track` is not a real track id.
5. A file with a valid shape but an unknown `intake` imports its completions and leaves the
   device's intake untouched — it does not refuse and does not clear the intake.
6. Duplicate ids in `completed` land once; unknown-but-string ids are kept.
7. Export → reset → import of the same file restores the exact set and the same intake.
8. Import replaces rather than merges: a device with `{a, b}` importing `{b, c}` ends with
   `{b, c}`.
9. After an import the map re-renders from the new set with no reload — the masthead count,
   the fog, the dots and the walker all move — because one set feeds all of them.
10. Reset requires two clicks; one click leaves progress intact. After a reset,
   `localStorage` has no `roadmap:progress:v1` key holding a non-empty set, and the map
   shows `0 / n DONE`.
11. Closing the panel and reopening it shows the reset disarmed and no stale status line.
12. The panel is a modal `<dialog>`: `Escape` closes it, focus lands inside it on open, and
    clicking the backdrop closes it — the same three behaviours `NodePanel` already has.
13. The control is reachable from both screens: the intake picker (so a new device can
    import before choosing anything) and the map.
14. Importing a file that carries an intake for another track switches the map to that track.
15. No hardcoded colour, font, or size literal outside `theme.css`; `portability.css` uses
    tokens only and lives inside `@layer components`.
16. At 360px width the panel fits with no horizontal overflow and every control is reachable.
17. `T075` in `BACKLOG.md` closes: `clearCompleted` and `resetProgress` now have a caller.
