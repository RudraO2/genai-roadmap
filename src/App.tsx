import type { ReactNode } from 'react'

import { Section } from './components/Section.tsx'
import { Shell } from './components/Shell.tsx'
import { registry } from './data/registry.ts'

/**
 * The first real screen: a static index of the four tracks, read from the live
 * registry. Not links, not buttons — track selection is spec 03. This exists to
 * exercise theme.css against real strings before any product feature lands.
 */
export default function App(): ReactNode {
  const trackIds = registry.trackIds
  return (
    <Shell
      masthead={
        <span className="shell__masthead-meta">
          {registry.nodes.length} NODES / {trackIds.length} TRACKS
        </span>
      }
    >
      <Section
        index="01"
        kicker="Interactive Roadmap"
        title="Pick a track"
        standfirst="Four ways to ship something real. Nodes are shared freely across all of them."
      >
        <ul className="track-list">
          {trackIds.map((id, i) => {
            const track = registry.tracks[id]
            const nodeCount = registry.orderedNodeIds(id).length
            const actCount = registry.actsForTrack(id).length
            return (
              <li className="track-row" key={id}>
                <span className="track-row__id">{String(i + 1).padStart(2, '0')}</span>
                <span className="track-row__title">{track.title}</span>
                <span className="track-row__destination">{track.destination}</span>
                <span className="track-row__meta">
                  {nodeCount} nodes / {actCount} acts
                </span>
              </li>
            )
          })}
        </ul>
      </Section>
    </Shell>
  )
}
