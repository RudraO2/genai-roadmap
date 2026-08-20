import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useProgressContext } from '../data/ProgressContext.ts'
import { registry } from '../data/roadmap.ts'
import { computePathProgress } from '../data/state.ts'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { useVisited } from '../hooks/useVisited.ts'
import type { LearningPath, Level, StageId } from '../types.ts'
import { GraphCanvas, matchNodes } from './GraphCanvas.tsx'
import { MapControls, type MapView } from './MapControls.tsx'
import { NextUp } from './NextUp.tsx'
import { PathBar } from './PathBar.tsx'
import { QuestPanel } from './QuestPanel.tsx'
import { StageList } from './StageList.tsx'

export interface RoadmapScreenProps {
  path: LearningPath
  level: Level
  /** The quest the URL says is open, already validated against this path. */
  openId: string | null
  onOpenQuest: (id: string) => void
  onCloseQuest: () => void
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
      <li className="legend__item" data-legend="visited">
        Opened before
      </li>
    </ul>
  )
}

/**
 * The map screen: the orientation bar, the recommendation, the controls, the
 * graph, the legend, and the one dialog that everything opens into.
 *
 * All of the derived state is computed here, once, from the completed set — so the
 * banner, the stage tallies, the node states and the edge states are the same
 * numbers rather than four independent counts that can drift apart.
 *
 * Two pieces of interface state live here rather than inside a view, because
 * both views have to agree about them:
 *
 *   expanded   which stages are drawn in full. The map opens on the stage in
 *              play and nothing else, which is what stops a fifty-nine quest
 *              path from arriving as an undifferentiated wall
 *   focusedId  the quest opened most recently, kept after its dialog closes, so
 *              closing a panel does not erase the record of where you were
 *
 * Which quest is *open* is not state here at all — it is the URL, handed down
 * from `App`. That is what makes a quest linkable and what makes the phone's
 * Back gesture close the dialog instead of leaving the site.
 *
 * Marking a quest done still never moves the view: a screen that jumps out from
 * under a pointer is worse than a stale one. Scrolling happens for one reason
 * only — an explicit "take me to that quest", from a search hit, a prerequisite
 * chip or the stage stepper — where standing still would be the confusing
 * answer.
 */
export function RoadmapScreen({
  path,
  level,
  openId,
  onOpenQuest,
  onCloseQuest,
}: RoadmapScreenProps): ReactNode {
  const { completed, toggle } = useProgressContext()
  const { visited, markVisited } = useVisited()
  const wide = useMediaQuery(WIDE)

  const [preferredView, setPreferredView] = useState<MapView | null>(null)
  const [search, setSearch] = useState('')
  const [showOptional, setShowOptional] = useState(true)
  const [hideDone, setHideDone] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [focusedId, setFocusedId] = useState<string | null>(openId)

  const progress = useMemo(() => computePathProgress(path, completed), [path, completed])
  const nodes = useMemo(() => registry.nodesForPath(path.id), [path.id])

  const [expanded, setExpanded] = useState<ReadonlySet<StageId>>(
    () => new Set(progress.currentStage === null ? [] : [progress.currentStage]),
  )

  // Two adjustments, both made during render rather than in an effect. An
  // effect runs after paint, which would mean one visible frame of the wrong
  // thing — the whole map collapsed on a path switch, or the stage you just
  // unlocked shut. React re-runs the component before committing instead, so
  // neither frame is ever drawn. This is the sanctioned shape for it: state
  // set conditionally, on this component only, with the trigger stored beside
  // the state it adjusts.
  //
  //   path changed     re-base on the new path's own current stage, rather
  //                    than carrying over stage ids from somewhere else
  //   stage advanced   finishing a stage moves the recommendation into the
  //                    next one, and "you are here now" has to mean it is
  //                    open. Additive, so a stage opened by hand stays open.
  const currentStage = progress.currentStage
  const [tracked, setTracked] = useState({ path: path.id, stage: currentStage })
  if (tracked.path !== path.id) {
    setTracked({ path: path.id, stage: currentStage })
    setExpanded(new Set(currentStage === null ? [] : [currentStage]))
  } else if (tracked.stage !== currentStage) {
    setTracked({ path: path.id, stage: currentStage })
    if (currentStage !== null && !expanded.has(currentStage)) {
      setExpanded(new Set([...expanded, currentStage]))
    }
  }

  const allStages = path.stages.every((stageId) => expanded.has(stageId))

  const setAllStages = useCallback(
    (value: boolean) => {
      setExpanded(new Set(value ? path.stages : currentStage === null ? [] : [currentStage]))
    },
    [path.stages, currentStage],
  )

  const toggleStage = useCallback((stageId: StageId) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(stageId)) next.add(stageId)
      return next
    })
  }, [])

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

  // Everything that follows from a quest being open, in one place, keyed on the
  // URL rather than on the click. A quest reached by Back, by Forward, or by a
  // link pasted into a fresh tab has to leave the same marks as one reached by
  // clicking its card, and this is what guarantees that.
  useEffect(() => {
    if (openId === null) return
    setFocusedId(openId)
    markVisited(openId)
    const stage = registry.getNode(openId).stage
    setExpanded((current) => (current.has(stage) ? current : new Set([...current, stage])))
  }, [openId, markVisited])

  // Set together with whatever expands the target's stage, so the effect below
  // runs on the paint that has the target on the page rather than the one before.
  const [scrollTo, setScrollTo] = useState<string | null>(null)

  useEffect(() => {
    if (scrollTo === null) return
    setScrollTo(null)
    const element = document.getElementById(scrollTo)
    if (!element) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: still ? 'auto' : 'smooth' })
  }, [scrollTo, expanded, view])

  /** Open the quest *and* take the map to it. For jumps from somewhere else. */
  const goTo = useCallback(
    (id: string) => {
      onOpenQuest(id)
      setScrollTo(`quest-${id}`)
    },
    [onOpenQuest],
  )

  const jumpToStage = useCallback((stageId: StageId) => {
    setExpanded((current) => (current.has(stageId) ? current : new Set([...current, stageId])))
    setScrollTo(`stage-${stageId}`)
  }, [])


  return (
    <div className="roadmap" data-path={path.id}>
      <PathBar
        path={path}
        level={level}
        progress={progress}
        expanded={expanded}
        onJump={jumpToStage}
      />

      {/* The finish line, in one line. The full editorial header this replaces
          was three paragraphs of standing type that a returning learner had
          read forty times and had to scroll past anyway. */}
      <p className="roadmap__aim">
        <span className="roadmap__aim-label">Finish line</span>
        {path.goal}
      </p>

      <NextUp progress={progress} onOpen={goTo} onToggle={toggle} />

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
        allStages={allStages}
        onAllStages={setAllStages}
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
                  <button type="button" className="results__hit" onClick={() => goTo(node.id)}>
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
              level={level}
              progress={progress}
              completed={completed}
              hidden={hidden}
              expanded={expanded}
              matches={matches}
              visited={visited}
              focusedId={focusedId}
              zoom={zoom}
              onOpen={onOpenQuest}
              onToggle={toggle}
              onToggleStage={toggleStage}
            />
          </div>
        </>
      ) : (
        <StageList
          path={path}
          level={level}
          progress={progress}
          hidden={hidden}
          expanded={expanded}
          matches={matches}
          visited={visited}
          focusedId={focusedId}
          onOpen={onOpenQuest}
          onToggle={toggle}
          onToggleStage={toggleStage}
        />
      )}

      <QuestPanel
        node={openNode}
        path={path}
        level={level}
        completed={completed}
        onClose={onCloseQuest}
        onToggle={toggle}
        onOpen={goTo}
        onPath={onPath}
      />
    </div>
  )
}
