import type { ReactNode } from 'react'
import type { IntakeState } from '../data/intake.ts'
import { useProgressContext } from '../data/ProgressContext.ts'
import { registry } from '../data/roadmap.ts'
import { computePathProgress } from '../data/state.ts'
import type { PathId } from '../types.ts'
import { COURSE_COPY, CourseIcon } from './CourseIcon.tsx'

export function Home({ intake, onStart }: { intake: IntakeState | null; onStart: (path: PathId) => void }): ReactNode {
  const { completed } = useProgressContext()
  const path = registry.getPath(intake?.path ?? 'explorer')
  const progress = computePathProgress(path, completed)
  const returning = intake !== null
  return <div className="home">
    <section className="home-hero">
      <div className="home-hero__copy">
        <p className="eyebrow"><span className="status-dot" /> A little curiosity is all you need</p>
        <h1>AI feels big.<br />Start <span>small.</span></h1>
        <p className="home-hero__intro">You don’t need to know everything to begin. Learn one useful thing, try it for yourself, and take the next step.</p>
        <button className="button button--primary" onClick={() => onStart(path.id)}>{returning ? 'Continue learning' : 'Start with the basics'} <span aria-hidden="true">→</span></button>
        <p className="home-hero__note">Free to explore · No account needed · Go at your pace</p>
      </div>
      <div className="journey-preview" aria-label="A preview of your learning journey">
        <div className="journey-preview__heading"><span>Your next small win</span><span className="badge">{returning ? 'Welcome back' : 'Start here'}</span></div>
        <div className="journey-preview__lesson">
          <span className="course-icon" data-path={path.id}><CourseIcon id={path.id} /></span>
          <p>{path.title}</p><h2>{progress.next?.title ?? 'You’ve finished this path!'}</h2>
          <p>{returning ? `${progress.overall.done} ${progress.overall.done === 1 ? 'lesson' : 'lessons'} completed. Your place is saved.` : 'Learn what AI can do, what it can’t, and why it sometimes gets things wrong.'}</p>
          <div className="journey-preview__bottom"><span>{progress.next ? `${progress.next.est} · Guided activity` : 'All lessons complete'}</span><button type="button" className="circle-arrow" aria-label={`Open ${path.title}`} onClick={() => onStart(path.id)}>↗</button></div>
        </div>
        <div className="journey-preview__trail" aria-hidden="true"><span className="trail-point">1</span><i /><span className="trail-point trail-point--quiet">2</span><i /><span className="trail-point trail-point--quiet">3</span><span>One step at a time.</span></div>
        <p className="journey-preview__foot">A clear next step, every time you come back.</p>
      </div>
    </section>
    <section className="how-it-works" aria-labelledby="how-title">
      <p className="eyebrow" id="how-title">Less overwhelm. More “I made that.”</p>
      <ol>
        <li><span>01</span><div><h2>Learn one idea</h2><p>A clear explanation and a resource worth your time.</p></div></li>
        <li><span>02</span><div><h2>Try something real</h2><p>Follow a practical activity. Make the idea click.</p></div></li>
        <li><span>03</span><div><h2>Build on your progress</h2><p>Check it off. We’ll point you to what comes next.</p></div></li>
      </ol>
    </section>
    <section className="home-courses" aria-labelledby="explore-title">
      <div className="section-heading"><div><p className="eyebrow">Follow your curiosity</p><h2 id="explore-title">Where will you go?</h2></div><a className="text-link" href="#/courses">Explore all courses →</a></div>
      <div className="course-shortcuts">{registry.paths.map((item) => <a key={item.id} href={`#/${item.id}`} className="course-shortcut" data-path={item.id}>
        <span className="course-icon"><CourseIcon id={item.id} /></span><h3>{COURSE_COPY[item.id]?.title ?? item.title}</h3><p>{COURSE_COPY[item.id]?.audience}</p><span className="text-link">View learning path →</span>
      </a>)}</div>
    </section>
    <aside className="reassurance"><span className="reassurance__mark" aria-hidden="true">?</span><div><h2>“What if I’m completely new?”</h2><p>That’s a good place to start. Begin with AI Explorer. You can switch paths whenever you like, and the lessons you finish stay with you.</p></div><button className="text-link" onClick={() => onStart('explorer')}>Take the first step →</button></aside>
  </div>
}
