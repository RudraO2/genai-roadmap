import type { ReactNode } from 'react'

import { registry, registryWarnings } from '../data/registry.ts'

export interface ShellProps {
  /** The screen. Mounts inside <main>, which owns the page's vertical rhythm. */
  children: ReactNode
  /** Right-hand masthead slot: short mono facts, e.g. "67 NODES". Optional. */
  masthead?: ReactNode
}

/**
 * The frame every screen mounts inside: masthead, main, colophon. The colophon
 * states the registry's node and warning counts unconditionally — a clean
 * registry and one with warnings render through the same line, never a
 * special-cased error style (spec 02 edge cases).
 */
export function Shell({ children, masthead }: ShellProps): ReactNode {
  const warningCount = registryWarnings.length
  return (
    <div className="shell">
      <a className="shell__skip-link" href="#main">
        Skip to content
      </a>
      <header className="shell__masthead">
        <span className="shell__wordmark">Interactive Roadmap</span>
        {masthead}
      </header>
      <main id="main" className="shell__main">
        {children}
      </main>
      <footer className="shell__colophon">
        {registry.nodes.length} nodes indexed, {warningCount} warning
        {warningCount === 1 ? '' : 's'}.
      </footer>
    </div>
  )
}
