import { useEffect, useRef, type ReactNode } from 'react'

import { SEARCH_LABEL, SEARCH_URL, TYPE_LABEL } from '../constants.ts'
import { registry } from '../data/roadmap.ts'
import { blockedBy, levelFit, stateOf } from '../data/state.ts'
import type { LearningPath, Level, RoadmapNode } from '../types.ts'

const FIT_NOTE: Readonly<Record<'review' | 'stretch', string>> = {
  review: 'Below the level you gave, so treat it as revision — skim it, tick it, move on.',
  stretch: 'Two levels above where you said you were. Nothing stops you opening it; expect it to take longer than the estimate, and expect to need the quests pointing at it.',
}

export interface QuestPanelProps {
  node: RoadmapNode | null
  /** The path this quest is being read on. Only its identity is used. */
  path: LearningPath
  level: Level
  completed: ReadonlySet<string>
  onClose: () => void
  onToggle: (id: string) => void
  /** Jump to another quest — a prerequisite, or something this one unlocks. */
  onOpen: (id: string) => void
  /**
   * Whether a node id is on the path the learner is currently walking. Used to
   * filter the unlocks list: a quest is a prerequisite for things on other paths
   * too, and listing those here offers a link to somewhere this map cannot go.
   */
  onPath: (id: string) => boolean
}

function starLabel(stars: number): string {
  return stars >= 1000 ? `${(stars / 1000).toFixed(1)}k★` : `${stars}★`
}

/**
 * Everything a learner needs to actually do one quest: what to do, why now, the
 * steps, how to know it is finished, and every link — the verified ones and a set
 * of live searches for anything a stored URL cannot promise.
 *
 * A controlled native `<dialog>`: this syncs `showModal()` / `close()` to the
 * `open` prop rather than exposing an imperative handle, so Escape (which fires
 * the native close event) and the close button funnel through one `onClose`.
 *
 * Prerequisites and unlocks are rendered as buttons into the same panel, which is
 * what makes the graph navigable rather than merely visible: the answer to "why
 * is this locked" is one click away, and so is the thing it was waiting for.
 */
export function QuestPanel({
  node,
  path,
  level,
  completed,
  onClose,
  onToggle,
  onOpen,
  onPath,
}: QuestPanelProps): ReactNode {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const open = node !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!node) {
    return <dialog ref={dialogRef} className="quest" aria-label="Quest details" onClose={onClose} />
  }

  const state = stateOf(node, completed)
  const fit = levelFit(node, level)
  const blockers = blockedBy(node, completed)
  const unlocks = registry
    .unlockedBy(node.id)
    .filter(onPath)
    .map((id) => registry.getNode(id))
  const stage = registry.getStage(node.stage)
  const titleId = `quest-title-${node.id}`
  const done = state === 'done'

  return (
    <dialog
      ref={dialogRef}
      className="quest"
      data-path={path.id}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="quest__content">
        <button type="button" className="quest__close" onClick={onClose}>
          Close
        </button>

        {/* A breadcrumb rather than a label. Opening a quest from a search hit
            used to drop you into a panel with no statement of where it sat —
            which path, which stage — and closing it put you back on a map you
            had lost your place in. */}
        <p className="quest__kicker">
          <span className="quest__crumb">{path.title}</span>
          <span className="quest__crumb-sep" aria-hidden="true">/</span>
          <span className="quest__crumb">{stage.title}</span>
          <span className="quest__crumb-sep" aria-hidden="true">/</span>
          <span className="quest__crumb">{TYPE_LABEL[node.type]}</span>
        </p>
        <h2 id={titleId} className="quest__title">
          {node.title}
        </h2>
        <p className="quest__blurb">{node.blurb}</p>

        <dl className="quest__facts">
          <div className="quest__fact">
            <dt>Time</dt>
            <dd>{node.est}</dd>
          </div>
          <div className="quest__fact">
            <dt>Reward</dt>
            <dd>{node.xp} XP</dd>
          </div>
          <div className="quest__fact">
            <dt>Status</dt>
            <dd data-state={state}>{done ? 'Done' : state === 'ready' ? 'Ready now' : 'Locked'}</dd>
          </div>
          <div className="quest__fact">
            <dt>Level</dt>
            <dd>
              {node.level}
              {fit === 'match' ? null : ` · ${fit}`}
            </dd>
          </div>
        </dl>

        {fit === 'match' ? null : <p className="quest__fit-note">{FIT_NOTE[fit]}</p>}

        {blockers.length > 0 ? (
          <div className="quest__block">
            <p className="quest__block-title">Finish these first</p>
            <ul className="quest__chips">
              {blockers.map((blocker) => (
                <li key={blocker.id}>
                  <button type="button" className="quest__chip" onClick={() => onOpen(blocker.id)}>
                    {blocker.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className="quest__section">
          <h3 className="quest__heading">The mission</h3>
          <p className="quest__mission">{node.mission}</p>
          <p className="quest__why">{node.why}</p>
        </section>

        <section className="quest__section">
          <h3 className="quest__heading">How to do it</h3>
          <ol className="quest__steps">
            {node.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="quest__section">
          <h3 className="quest__heading">Done when</h3>
          <ul className="quest__done-when">
            {node.done_when.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="quest__section">
          <h3 className="quest__heading">Go here</h3>
          <p className="quest__hint">
            Checked when this registry was written. This roadmap points at the good material; it
            does not reprint it.
          </p>
          <ul className="quest__links">
            {node.links.map((link) => (
              <li key={link.url}>
                <a className="quest__link" href={link.url} target="_blank" rel="noreferrer">
                  <span className="quest__link-label">{link.label}</span>
                  <span className="quest__link-meta">
                    <span className="quest__link-kind">{link.kind}</span>
                    {link.stars !== undefined ? (
                      <span className="quest__link-stars">{starLabel(link.stars)}</span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="quest__section">
          <h3 className="quest__heading">Or search it yourself</h3>
          <p className="quest__hint">
            A live query, built when you click it. It cannot rot, and it is the honest answer for
            anything whose canonical page moves.
          </p>
          {/* Built from the query at render time rather than stored, so these can
              never rot the way a saved URL can — and they are the honest answer for
              anything whose canonical page moves. */}
          <ul className="quest__searches">
            {node.search.map((query) => (
              <li key={`${query.on}:${query.q}`}>
                <a
                  className="quest__search"
                  href={SEARCH_URL[query.on](query.q)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="quest__search-on">{SEARCH_LABEL[query.on]}</span>
                  <span className="quest__search-q">{query.q}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {unlocks.length > 0 ? (
          <section className="quest__section">
            <h3 className="quest__heading">Unlocks</h3>
            <ul className="quest__chips">
              {unlocks.map((unlocked) => (
                <li key={unlocked.id}>
                  <button type="button" className="quest__chip" onClick={() => onOpen(unlocked.id)}>
                    {unlocked.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="quest__actions">
          {/* The second way out, for the phone layout, where the dialog fills
              the screen and there is no backdrop left to tap. The stylesheet
              shows exactly one of the two Close buttons at any width. */}
          <button type="button" className="quest__dismiss" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="quest__complete"
            aria-pressed={done}
            onClick={() => onToggle(node.id)}
          >
            {done ? 'Done — undo' : `Mark done (+${node.xp} XP)`}
          </button>
        </div>
      </div>
    </dialog>
  )
}
