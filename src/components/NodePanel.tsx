import { useEffect, useRef, type ReactNode } from 'react'

import { KINDS } from '../constants.ts'
import type { Node } from '../types.ts'

export interface NodePanelProps {
  node: Node
  open: boolean
  onClose: () => void
}

/**
 * A node's full metadata: links grouped by `kind`, star count, last commit
 * date, status, and note. Pointers and facts about a URL only — never a
 * description of what the tool is or how to use it (CONTEXT.md section 3).
 *
 * A controlled native `<dialog>`: this component syncs `dialog.showModal()` /
 * `dialog.close()` to the `open` prop rather than exposing an imperative
 * handle, so `Escape` (which fires the native `close` event) and an explicit
 * close button both funnel through the same `onClose`.
 */
export function NodePanel({ node, open, onClose }: NodePanelProps): ReactNode {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const groups = KINDS.map((kind) => ({
    kind,
    links: node.links.filter((link) => link.kind === kind),
  })).filter((group) => group.links.length > 0)

  const titleId = `node-panel-title-${node.id}`

  return (
    <dialog
      ref={dialogRef}
      className="node-panel"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="node-panel__content">
        <button type="button" className="node-panel__close" onClick={onClose}>
          Close
        </button>

        <p className="node-panel__kicker">
          {node.level} / {node.status}
        </p>
        <h2 id={titleId} className="node-panel__title">
          {node.title}
        </h2>

        <dl className="node-panel__facts">
          <div className="node-panel__fact">
            <dt>Stars</dt>
            <dd>{node.stars ?? 'unverified'}</dd>
          </div>
          <div className="node-panel__fact">
            <dt>Last commit</dt>
            <dd>{node.last_commit ?? 'unverified'}</dd>
          </div>
        </dl>

        {node.note ? <p className="node-panel__note">{node.note}</p> : null}

        {groups.map((group) => (
          <div className="node-panel__group" key={group.kind}>
            <h3 className="node-panel__group-title">{group.kind}</h3>
            <ul className="node-panel__links">
              {group.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </dialog>
  )
}
