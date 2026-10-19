import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SEARCH_LABEL, SEARCH_URL } from '../constants.ts'
import { registry } from '../data/roadmap.ts'
import { blockedBy, computePathProgress, levelFit, stateOf } from '../data/state.ts'
import type { LearningPath, Level, RoadmapNode } from '../types.ts'

export interface QuestPanelProps {
  node: RoadmapNode | null
  path: LearningPath
  level: Level
  completed: ReadonlySet<string>
  onClose: () => void
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onPath: (id: string) => boolean
}

export function QuestPanel({ node, path, level, completed, onClose, onToggle, onOpen }: QuestPanelProps): ReactNode {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const stepRef = useRef<HTMLHeadingElement | null>(null)
  const [step, setStep] = useState(0)
  const [trackedId, setTrackedId] = useState(node?.id)
  if (trackedId !== node?.id) {
    setTrackedId(node?.id)
    setStep(0)
  }
  const open = node !== null
  useEffect(() => {
    const dialog = dialogRef.current
    if (open && dialog && !dialog.open) dialog.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  useEffect(() => {
    dialogRef.current?.querySelector('.quest__content')?.scrollTo({ top: 0 })
  }, [node?.id])
  const changeStep = (value: number): void => {
    setStep(value)
    // Wait for the new step's text to commit before moving keyboard focus.
    requestAnimationFrame(() => stepRef.current?.focus())
  }
  if (!node) return <dialog ref={dialogRef} className="quest" aria-label="Lesson details" onClose={onClose} />
  const done = stateOf(node, completed) === 'done'
  const blockers = blockedBy(node, completed)
  const next = computePathProgress(path, completed).next
  const finalStep = step === node.steps.length
  const fit = levelFit(node, level)

  return <dialog ref={dialogRef} className="quest" data-path={path.id} aria-labelledby="lesson-title" onClose={onClose}
    onClick={(event) => { if (event.target === dialogRef.current) onClose() }}>
    <div className="quest__content">
      <div className="lesson-top"><p className="eyebrow">{path.title} / {registry.getStage(node.stage).title}</p><button type="button" className="lesson-close" onClick={onClose} aria-label="Close lesson">✕</button></div>
      <h2 id="lesson-title" className="quest__title">{node.title}</h2>
      <p className="lesson-duration">{node.est} estimated · {done ? 'Completed' : 'Guided activity'}{fit !== 'match' ? ` · ${fit === 'review' ? 'A chance to review' : 'A stretch for your level'}` : ''}</p>
      {done ? <div className="lesson-success" role="status"><span aria-hidden="true">✓</span><p className="eyebrow">One more step forward</p><h3>Nice work. Lesson complete.</h3><p>Your progress is saved on this browser.</p></div> : <>
        {blockers.length > 0 ? <aside className="lesson-blockers"><strong>You’re getting a sneak peek.</strong><p>Complete these lessons first to build the skills you’ll need:</p><div className="quest__chips">{blockers.map((blocker) => <button key={blocker.id} type="button" className="quest__chip" onClick={() => onOpen(blocker.id)}>{blocker.title} →</button>)}</div></aside> : null}
        <p className="lesson-mission">{node.mission}</p>
        <div className="lesson-step-progress" aria-label={`Step ${step + 1} of ${node.steps.length + 1}`}>{[...node.steps, 'Finish'].map((_, index) => <span key={index} data-active={index <= step ? 'true' : undefined} />)}</div>
        <section className="lesson-step">
          <p className="eyebrow">{finalStep ? 'Before you check it off' : `Step ${step + 1} of ${node.steps.length}`}</p>
          <h3 ref={stepRef} tabIndex={-1}>{finalStep ? 'How did you do?' : 'Give it a try'}</h3>
          {finalStep ? <ul className="quest__done-when">{node.done_when.map((line) => <li key={line}>{line}</li>)}</ul> : <p className="lesson-step__instruction">{node.steps[step]}</p>}
          {!finalStep && node.links[0] ? <a className="lesson-resource" href={node.links[0].url} target="_blank" rel="noreferrer"><span><small>Start with this resource · opens a new tab</small><strong>{node.links[0].label}</strong></span><span aria-hidden="true">↗</span></a> : null}
        </section>
      </>}
      <div className="lesson-actions">
        {done ? <>
          <button type="button" className="button button--secondary" onClick={onClose}>Back to course</button>
          {next ? <button type="button" className="button button--primary" onClick={() => onOpen(next.id)}>Next lesson →</button> : <a className="button button--primary" href="#/courses" onClick={onClose}>Explore courses →</a>}
        </> : <>
          <button type="button" className="button button--secondary" onClick={() => step > 0 ? changeStep(step - 1) : onClose()}>{step > 0 ? '← Previous' : 'Back to course'}</button>
          {finalStep ? <button type="button" className="button button--primary" disabled={blockers.length > 0} onClick={() => onToggle(node.id)}>Complete lesson ✓</button> : <button type="button" className="button button--primary" onClick={() => changeStep(step + 1)}>Next step →</button>}
        </>}
      </div>
      <details className="lesson-more" key={node.id}><summary>Resources &amp; more about this lesson</summary><p>{node.why}</p>
        <ul className="quest__links">{node.links.map((link) => <li key={link.url}><a className="quest__link" href={link.url} target="_blank" rel="noreferrer"><span className="quest__link-label">{link.label}</span><span className="quest__link-meta">{link.kind} ↗</span></a></li>)}</ul>
        <h3>Find another explanation</h3><ul className="quest__searches">{node.search.map((query) => <li key={`${query.on}:${query.q}`}><a className="quest__search" href={SEARCH_URL[query.on](query.q)} target="_blank" rel="noreferrer"><span className="quest__search-on">{SEARCH_LABEL[query.on]}</span><span className="quest__search-q">{query.q}</span></a></li>)}</ul>
        {done ? <button type="button" className="text-link" onClick={() => onToggle(node.id)}>Mark lesson as unfinished</button> : null}
      </details>
    </div>
  </dialog>
}
