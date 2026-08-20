import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'

import { registry } from '../data/roadmap.ts'
import type { IntakeState } from '../data/intake.ts'
import {
  buildProgressFile,
  exportFilename,
  IMPORT_PROBLEM_MESSAGE,
  MAX_PROGRESS_FILE_BYTES,
  parseProgressFile,
  serializeProgressFile,
  type ImportedProgress,
} from '../data/portability.ts'

export interface ProgressPanelProps {
  open: boolean
  onClose: () => void
  completed: ReadonlySet<string>
  intake: IntakeState | null
  /** Applies an accepted file. The panel reports what it applied. */
  onImport: (imported: ImportedProgress) => void
  onReset: () => void
}

const questCount = (n: number): string => `${n} quest${n === 1 ? '' : 's'}`

/**
 * Export, import, reset. The whole sync story, and the only place it lives —
 * The project's standing constraint is localStorage plus a JSON file — no
 * backend, no account, no database — so there is no upload control here and
 * there must never be one.
 *
 * A controlled native `<dialog>`, the same pattern as `NodePanel`: the `open`
 * prop is synced to `showModal()` / `close()` rather than exposed as an
 * imperative handle, so `Escape`, the backdrop and the close button all funnel
 * through one `onClose`.
 *
 * Reset arms and confirms in place instead of calling `confirm()` — two clicks,
 * both inside the panel's own type. Closing disarms it, so an arm can never
 * outlive the panel it was made in.
 */
export function ProgressPanel({
  open,
  onClose,
  completed,
  intake,
  onImport,
  onReset,
}: ProgressPanelProps): ReactNode {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const statusRef = useRef<HTMLParagraphElement | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [armed, setArmed] = useState(false)

  // The panel scrolls on a phone, where the sentence sits below the fold and a
  // learner would never learn whether their import landed. `nearest` is a no-op
  // when it is already visible, so nothing moves on a desktop.
  useEffect(() => {
    if (status) statusRef.current?.scrollIntoView({ block: 'nearest' })
  }, [status])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    // A closed panel keeps no state: reopening must not show the last import's
    // sentence or a reset someone armed and thought better of.
    if (!open) {
      setStatus(null)
      setArmed(false)
    }
  }, [open])

  const handleExport = (): void => {
    const text = serializeProgressFile(buildProgressFile(completed, intake))
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = exportFilename()
    // In the document and removed again: a detached anchor's click is ignored
    // by some browsers, and the object URL is revoked a tick later because
    // revoking it in the same task can cancel the download that just started.
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setStatus(`Exported ${questCount(completed.size)}.`)
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.currentTarget
    const file = input.files?.[0]
    // Cleared synchronously, before the first await: picking the same file
    // twice must re-run the import rather than fire no change event at all.
    input.value = ''
    if (!file) return

    // Checked before the read, not after: the point is not to pull a gigabyte
    // into memory and hand it to `JSON.parse`.
    if (file.size > MAX_PROGRESS_FILE_BYTES) {
      setStatus(IMPORT_PROBLEM_MESSAGE['too-large'])
      return
    }

    let text: string
    try {
      text = await file.text()
    } catch {
      setStatus(IMPORT_PROBLEM_MESSAGE.unreadable)
      return
    }

    const result = parseProgressFile(text)
    if (!result.ok) {
      setStatus(IMPORT_PROBLEM_MESSAGE[result.problem])
      return
    }

    onImport(result.value)
    const chosen = result.value.intake ? registry.getPath(result.value.intake.path) : null
    setStatus(
      chosen
        ? `Imported ${questCount(result.value.completed.size)} and the ${chosen.title} path.`
        : `Imported ${questCount(result.value.completed.size)}.`,
    )
  }

  const handleConfirmReset = (): void => {
    onReset()
    setArmed(false)
    setStatus('Progress cleared on this device.')
  }

  return (
    <dialog
      ref={dialogRef}
      className="progress-panel"
      aria-labelledby="progress-panel-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="progress-panel__content">
        <button type="button" className="progress-panel__close" onClick={onClose}>
          Close
        </button>

        <p className="progress-panel__kicker">{questCount(completed.size)} marked done</p>
        <h2 id="progress-panel-title" className="progress-panel__title">
          Progress file
        </h2>
        <p className="progress-panel__standfirst">
          There is no account. A file is how this device and your next one agree.
        </p>

        <div className="progress-panel__row">
          <div className="progress-panel__row-head">
            <h3 className="progress-panel__row-title">Export</h3>
            <p className="progress-panel__row-note">
              Writes your finished quests and your chosen path to a JSON file.
            </p>
          </div>
          <button type="button" className="progress-panel__action" onClick={handleExport}>
            Save file
          </button>
        </div>

        <div className="progress-panel__row">
          <div className="progress-panel__row-head">
            <h3 className="progress-panel__row-title">Import</h3>
            <p className="progress-panel__row-note">
              Replaces this device&rsquo;s progress with the file&rsquo;s. Nothing is merged.
            </p>
          </div>
          {/* A real button, not a styled <label>: the button is focusable and
              activates on Enter and Space, which a label does not. */}
          <button
            type="button"
            className="progress-panel__action"
            onClick={() => fileRef.current?.click()}
          >
            Choose file
          </button>
          <input
            ref={fileRef}
            className="progress-panel__file"
            type="file"
            accept="application/json,.json"
            tabIndex={-1}
            onChange={(event) => {
              void handleFile(event)
            }}
          />
        </div>

        <div className="progress-panel__row">
          <div className="progress-panel__row-head">
            <h3 className="progress-panel__row-title">Reset</h3>
            <p className="progress-panel__row-note">
              Clears every mark on this device. Export first if you want it back.
            </p>
          </div>
          {armed ? (
            <span className="progress-panel__confirm">
              <button
                type="button"
                className="progress-panel__action progress-panel__action--armed"
                onClick={handleConfirmReset}
              >
                Confirm reset
              </button>
              <button
                type="button"
                className="progress-panel__action"
                onClick={() => setArmed(false)}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="progress-panel__action"
              onClick={() => setArmed(true)}
            >
              Reset progress
            </button>
          )}
        </div>

        <p ref={statusRef} className="progress-panel__status" aria-live="polite">
          {status}
        </p>
      </div>
    </dialog>
  )
}
