import { useState, type ReactNode } from 'react'
import type { IntakeState } from '../data/intake.ts'
import { registry } from '../data/roadmap.ts'
import type { Level, PathId } from '../types.ts'
import { COURSE_COPY, CourseIcon } from './CourseIcon.tsx'

export interface PathPickerProps {
  initialPath?: PathId | undefined
  initialLevel?: Level | undefined
  onComplete: (state: IntakeState) => void
}
export function PathPicker({ initialPath, initialLevel, onComplete }: PathPickerProps): ReactNode {
  const [level, setLevel] = useState<Level>(initialLevel ?? 'beginner')
  return <div className="courses-page">
    <header className="page-heading"><p className="eyebrow">A path for every kind of curious</p><h1>What would you like to do?</h1><p>Pick something that sounds interesting. Start with the basics, then go a little deeper. You can change your mind along the way.</p></header>
    <div className="course-recommendation"><span className="course-icon" data-path="explorer"><CourseIcon id="explorer" /></span><div><strong>New to AI? You’re in the right place.</strong><p>AI Explorer is our recommended starting point. No code, no background knowledge.</p></div><button className="text-link" onClick={() => onComplete({ path: 'explorer', level: 'beginner' })}>Start here →</button></div>
    <div className="course-grid">{registry.paths.map((path) => {
      const copy = COURSE_COPY[path.id]!
      const active = path.id === initialPath
      return <article className="course-card" data-path={path.id} key={path.id}>
        <div className="course-card__top"><span className="course-icon"><CourseIcon id={path.id} /></span><span className="badge">{active ? 'Your current path' : path.id === 'explorer' ? 'Recommended first' : path.title}</span></div>
        <h2>{copy.title}</h2><p className="course-card__description">{copy.description}</p><p className="course-card__audience">{copy.audience}</p>
        <details className="course-details"><summary>What you’ll learn <span>{path.stages.length} chapters</span></summary><ol>{path.stages.map((id) => <li key={id}>{registry.getStage(id).title}</li>)}</ol><p>{path.goal}</p></details>
        <button className={path.id === 'explorer' ? 'button button--primary' : 'button button--secondary'} onClick={() => onComplete({ path: path.id, level })}>{active ? 'Continue course' : 'Start course'} <span aria-hidden="true">→</span></button>
      </article>
    })}</div>
    <details className="level-settings"><summary>Already have some experience?</summary><label>Your starting level <select value={level} onChange={(event) => setLevel(event.target.value as Level)}><option value="beginner">I’m starting fresh</option><option value="intermediate">I know the basics</option><option value="advanced">I’m ready for advanced topics</option></select></label><p>This adds review and stretch hints to lessons. Every lesson stays available.</p></details>
  </div>
}
