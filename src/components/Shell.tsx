import type { ReactNode } from 'react'

import { linkCount, registry, registryWarnings } from '../data/roadmap.ts'

export interface ShellProps {
  /** The screen. Mounts inside <main>, which owns the page's vertical rhythm. */
  children: ReactNode
  /** Right-hand masthead slot: short mono facts and controls. Optional. */
  masthead?: ReactNode
  activePage?: 'home' | 'courses' | 'learning'
  learningPath?: string
}

/**
 * The frame every screen mounts inside: masthead, main, colophon. The colophon
 * states what the registry holds and when it was checked, unconditionally — a
 * clean registry and one with warnings render through the same line, never a
 * special-cased error style.
 */
export function Shell({ children, masthead, activePage, learningPath = 'explorer' }: ShellProps): ReactNode {
  const warningCount = registryWarnings.length
  return (
    <div className="shell">
      <a className="shell__skip-link" href="#main" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main')?.focus()
      }}>
        Skip to content
      </a>
      <header className="shell__masthead">
        <a className="shell__wordmark" href="#/" aria-label="The Gen AI Roadmap home">
          <span className="shell__mark">GA</span>
          The Gen AI Roadmap
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#/" aria-current={activePage === 'home' ? 'page' : undefined}>Home</a>
          <a href="#/courses" aria-current={activePage === 'courses' ? 'page' : undefined}>Courses</a>
          <a href={`#/${learningPath}`} aria-current={activePage === 'learning' ? 'page' : undefined}>My learning</a>
        </nav>
        {masthead}
      </header>
      <main id="main" className="shell__main" tabIndex={-1}>
        {children}
      </main>
      <footer className="shell__colophon">
        <span>Small steps. Real skills. Your own pace.</span>
        <details><summary>About this roadmap</summary>
          <p>{registry.nodes.length} lessons across {registry.paths.length} paths. A curated guide to external learning resources, with practical tasks and a checklist for each lesson. Resource registry checked {registry.generated}; {linkCount} links{warningCount > 0 ? `, ${warningCount} warnings` : ''}.</p>
          <a href="https://github.com/RudraO2/genai-roadmap" target="_blank" rel="noreferrer">Explore the open-source project ↗</a>
        </details>
      </footer>
    </div>
  )
}
