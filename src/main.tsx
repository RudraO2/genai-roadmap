/**
 * Smoke test for spec 01. Proves the registry loads, validates, and indexes.
 *
 * Deliberately unstyled: `theme.css` does not exist yet and spec 02 owns every
 * colour, typeface and spacing decision. Spec 02 replaces the contents of this
 * file wholesale. Do not add a class, a style attribute or a stylesheet here.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { registry, registryWarnings } from './data/registry.ts'

function RegistrySummary() {
  return (
    <main>
      <h1>Interactive Roadmap</h1>
      <p>
        Registry loaded and validated: {registry.nodes.length} nodes,{' '}
        {registry.trackIds.length} tracks, {registryWarnings.length} warnings.
      </p>
      <dl>
        {registry.trackIds.map((id) => {
          const track = registry.tracks[id]
          const branchCount = track.branches.length
          return (
            <div key={id}>
              <dt>
                {track.title} — {track.destination}
              </dt>
              <dd>
                {registry.orderedNodeIds(id).length} nodes across{' '}
                {registry.actsForTrack(id).length} acts and {branchCount} frontier branches
              </dd>
            </div>
          )
        })}
      </dl>
    </main>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('missing #root element')

createRoot(container).render(
  <StrictMode>
    <RegistrySummary />
  </StrictMode>,
)
