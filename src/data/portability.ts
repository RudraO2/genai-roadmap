/**
 * Portability: the learner's progress as a file on disk. This is the entire
 * sync story — `CONTEXT.md` section 10 allows localStorage plus JSON
 * export/import and forbids a backend, an account and a database, so there is
 * no upload here, no share link, and there must never be one.
 *
 * React-free and DOM-free on purpose. The `Blob`, the object URL and the file
 * input live in the component; everything decidable about a file is decided
 * here, where it can be reasoned about without a browser.
 *
 * The parser is total: every input returns a result and none throws. A file
 * chosen from a Downloads folder is arbitrary bytes — someone else's JSON, a
 * truncated write, a hand edit, a version this build has never seen — and each
 * of those is a sentence the learner can read, not a stack trace.
 */

import { parseIntake, type IntakeState } from './intake.ts'

/**
 * Bumped only when the shape changes in a way an older build cannot read. A
 * file from a future version is refused rather than guessed at.
 */
export const PROGRESS_FILE_VERSION = 1

/**
 * The discriminator. A learner's Downloads folder is full of JSON; `kind` makes
 * "this is not one of ours" a one-line answer instead of a shape inspection.
 */
export const PROGRESS_FILE_KIND = 'interactive-roadmap-progress'

/**
 * What lands on disk. Ids the learner has ticked and the intake they chose —
 * never a node's title, blurb or links. Section 3 holds here too: the file
 * carries pointers into the registry, not a copy of it.
 */
export interface ProgressFile {
  kind: typeof PROGRESS_FILE_KIND
  version: number
  /** ISO instant. Informational — nothing reads it back to order two files. */
  exported: string
  /** Null when the learner exported before finishing intake. */
  intake: IntakeState | null
  completed: string[]
}

/**
 * Refuse a file bigger than this without reading it. A 67-node registry exports
 * under 2KB and a hand-written file with a hundred thousand ids is still under
 * 2MB, so nothing legitimate comes close — but a misclick in a file dialog can
 * hand us a video, and `JSON.parse` on a gigabyte freezes the tab.
 */
export const MAX_PROGRESS_FILE_BYTES = 4 * 1024 * 1024

export type ImportProblem =
  /** Not JSON at all. */
  | 'unreadable'
  /** Far too big to be a progress file; refused before it is read. */
  | 'too-large'
  /** Parses, but is not one of ours. */
  | 'not-a-progress-file'
  /** Ours, from a version this build does not know how to read. */
  | 'unsupported-version'
  /** Ours and well-formed, but carries nothing to apply. */
  | 'empty'

export interface ImportedProgress {
  completed: ReadonlySet<string>
  intake: IntakeState | null
}

export type ImportResult =
  | { ok: true; value: ImportedProgress }
  | { ok: false; problem: ImportProblem }

/** One sentence per problem, for the panel's status line. */
export const IMPORT_PROBLEM_MESSAGE: Readonly<Record<ImportProblem, string>> = Object.freeze({
  unreadable: 'That file is not valid JSON. Nothing was changed.',
  'too-large': 'That file is far too large to be a progress file. Nothing was changed.',
  'not-a-progress-file': 'That is not a roadmap progress file. Nothing was changed.',
  'unsupported-version': 'That file was written by a newer version. Nothing was changed.',
  empty: 'That file carries no progress and no track. Nothing was changed.',
})

export function buildProgressFile(
  completed: ReadonlySet<string>,
  intake: IntakeState | null,
  now: Date = new Date(),
): ProgressFile {
  return {
    kind: PROGRESS_FILE_KIND,
    version: PROGRESS_FILE_VERSION,
    exported: now.toISOString(),
    intake,
    // Sorted so two exports of the same progress are the same bytes: a file a
    // person may keep in a git repo should not churn on set iteration order.
    completed: [...completed].sort(),
  }
}

/** Two-space indented with a trailing newline — a file a person may open. */
export function serializeProgressFile(file: ProgressFile): string {
  return `${JSON.stringify(file, null, 2)}\n`
}

/** `roadmap-progress-2026-08-18.json`, dated in the learner's own timezone. */
export function exportFilename(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `roadmap-progress-${year}-${month}-${day}.json`
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

/**
 * Total. Every input returns a result; nothing throws and nothing is applied
 * halfway — the caller either gets a whole importable state or a problem.
 */
export function parseProgressFile(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, problem: 'unreadable' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, problem: 'not-a-progress-file' }
  }

  const { kind, version, completed, intake } = parsed as Record<string, unknown>
  if (kind !== PROGRESS_FILE_KIND) return { ok: false, problem: 'not-a-progress-file' }
  if (!isPositiveInteger(version)) return { ok: false, problem: 'not-a-progress-file' }
  if (version > PROGRESS_FILE_VERSION) return { ok: false, problem: 'unsupported-version' }
  if (!Array.isArray(completed)) return { ok: false, problem: 'not-a-progress-file' }

  // Unknown ids are kept, exactly as `loadCompleted` keeps them: section 6
  // never deletes a node, so an id this build does not place may be a node from
  // another track, a later registry revision, or an earlier one. Non-strings
  // are dropped rather than refused — one bad element in an otherwise good file
  // is not a reason to throw the learner's progress away.
  const ids = new Set(completed.filter((id): id is string => typeof id === 'string'))

  // An intake this build cannot read is not a failure: the completions still
  // import and the device keeps the track and level it already had.
  const importedIntake = parseIntake(intake)

  if (ids.size === 0 && importedIntake === null) return { ok: false, problem: 'empty' }

  return { ok: true, value: { completed: ids, intake: importedIntake } }
}
