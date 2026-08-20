import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { useProgressContext } from '../data/ProgressContext.ts'
import { registry } from '../data/roadmap.ts'
import { computePathProgress } from '../data/state.ts'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import type { LearningPath, Level } from '../types.ts'
import { GraphCanvas, matchNodes } from './GraphCanvas.tsx'
import { MapControls, type MapView } from './MapControls.tsx'
import { NextUp } from './NextUp.tsx'
import { QuestPanel } from './QuestPanel.tsx'
import { StageList } from './StageList.tsx'

export interface RoadmapScreenProps {
  path: LearningPath
  level: Level
}

/** Below this the absolute grid stops being readable and the list is simply better. */
const WIDE = '(min-width: 64rem)'

function Legend(): ReactNode {
  return (
    <ul className="legend">
      <li className="legend__item" data-legend="ready">
        Ready — every prerequisite done
      </li>
      <li className="legend__item" data-legend="locked">
        Locked — finish what points at it
      </li>
      <li className="legend__item" data-legend="done">
        Done
      </li>
      <li className="legend__item" data-legend="side">
        Side quest — optional, dashed
      </li>
      <li className="legend__item" data-legend="boss">
        Capstone — the thing you show people
      </li>
    </ul>
  )
}

/**
 * The map screen: the recommendation, the controls, the graph, the legend, and the
 * one dialog that everything opens into.
 *
 * All of the derived state is computed here, once, from the completed set — so the
 * banner, the stage tallies, the node states and the edge states are the same
 * numbers rather than four independent counts that can drift apart.
 *
 * Nothing here navigates. Marking a quest done changes the recommendation and the
 * colours; it never scrolls the page or moves the view, because a screen that
 * jumps out from under a pointer is worse than a stale one.
 */
export function RoadmapScreen({ path, level }: RoadmapScreenProps): ReactNode {
  const { completed, toggle } = useProgressContext()
  const wide = useMediaQuery(WIDE)

  const [preferredView, setPreferredView] = useState<MapView | null>(null)
  const [search, setSearch] = useState('')
  const [showOptional, setShowOptional] = useState(true)
  const [hideDone, setHideDone] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const progress = useMemo(() => computePathProgress(path, completed), [path, completed])
  const nodes = useMemo(() => registry.nodesForPath(path.id), [path.id])

  const hidden = useMemo(() => {
    const set = new Set<string>()
    for (const node of nodes) {
      if (!showOptional && node.type === 'side') set.add(node.id)
      if (hideDone && completed.has(node.id)) set.add(node.id)
    }
    return set
  }, [nodes, showOptional, hideDone, completed])

  const matches = useMemo(
    () => (search.trim() === '' ? null : matchNodes(nodes, search)),
    [nodes, search],
  )

  // Membership of the current path, for the panel's unlocks list. Built from the
  // same node list the map is drawn from, so the two cannot disagree.
  const onPath = useMemo(() => {
    const ids = new Set(nodes.map((node) => node.id))
    return (id: string): boolean => ids.has(id)
  }, [nodes])

  const view: MapView = preferredView ?? (wide ? 'map' : 'list')
  const openNode = openId === null ? null : registry.getNode(openId)

  const open = useCallback((id: string) => setOpenId(id), [])
  const close = useCallback(() => setOpenId(null), [])

  return (
    <div className="roadmap">
      <header className="roadmap__head">
        <p className="roadmap__kicker">
          {path.title} — {path.tagline}
        </p>
        <h1 className="roadmap__title">{path.goal}</h1>
        <p className="roadmap__note">
          Every quest below has instructions, a finish condition, links that were checked when this
          registry was written, and searches that cannot go stale. Level chosen: {level}.
        </p>
      </header>

      <NextUp progress={progress} onOpen={open} onToggle={toggle} />

      <MapControls
        view={view}
        onView={setPreferredView}
        mapAvailable={wide}
        search={search}
        onSearch={setSearch}
        showOptional={showOptional}
        onShowOptional={setShowOptional}
        hideDone={hideDone}
        onHideDone={setHideDone}
        zoom={zoom}
        onZoom={setZoom}
      />

      {matches !== null ? (
        <div className="results">
          <p className="results__label">
            {matches.size} match{matches.size === 1 ? '' : 'es'}
          </p>
          <ul className="results__list">
            {nodes
              .filter((node) => matches.has(node.id))
              .map((node) => (
                <li key={node.id}>
                  <button type="button" className="results__hit" onClick={() => open(node.id)}>
                    <span className="results__hit-title">{node.title}</span>
                    <span className="results__hit-stage">{registry.getStage(node.stage).title}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {view === 'map' ? (
        <>
          <Legend />
          <div className="graph-scroll">
            <GraphCanvas
              path={path}
              progress={progress}
              completed={completed}
              hidden={hidden}
              matches={matches}
              zoom={zoom}
              onOpen={open}
              onToggle={toggle}
            />
          </div>
        </>
      ) : (
        <StageList
          path={path}
          progress={progress}
          hidden={hidden}
          matches={matches}
          onOpen={open}
          onToggle={toggle}
        />
      )}

      <QuestPanel
        node={openNode}
        completed={completed}
        onClose={close}
        onToggle={toggle}
        onOpen={open}
        onPath={onPath}
      />
    </div>
  )
}
