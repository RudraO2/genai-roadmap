import type { ReactNode } from 'react'

import { linkCount, registry, registryWarnings } from '../data/roadmap.ts'

export interface ShellProps {
  /** The screen. Mounts inside <main>, which owns the page's vertical rhythm. */
  children: ReactNode
  /** Right-hand masthead slot: short mono facts and controls. Optional. */
  masthead?: ReactNode
}

/**
 * The frame every screen mounts inside: masthead, main, colophon. The colophon
 * states what the registry holds and when it was checked, unconditionally — a
 * clean registry and one with warnings render through the same line, never a
 * special-cased error style.
 */
export function Shell({ children, masthead }: ShellProps): ReactNode {
  const warningCount = registryWarnings.length
  return (
    <div className="shell">
      <a className="shell__skip-link" href="#main">
        Skip to content
      </a>
      <header className="shell__masthead">
        <span className="shell__wordmark">
          <span className="shell__mark">GA</span>
          The Gen AI Roadmap
        </span>
        {masthead}
      </header>
      <main id="main" className="shell__main">
        {children}
      </main>
      <footer className="shell__colophon">
        {registry.nodes.length} quests, {linkCount} links, {registry.paths.length} paths. Registry
        checked {registry.generated}
        {warningCount > 0 ? `, ${warningCount} warning${warningCount === 1 ? '' : 's'}` : null}.
      </footer>
    </div>
  )
}
