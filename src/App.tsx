import { useEffect, useState, type ReactNode } from 'react'

import { PathPicker } from './components/PathPicker.tsx'
import { ProgressPanel } from './components/ProgressPanel.tsx'
import { RoadmapScreen } from './components/RoadmapScreen.tsx'
import { Shell } from './components/Shell.tsx'
import type { ImportedProgress } from './data/portability.ts'
import { ProgressContext } from './data/ProgressContext.ts'
import { registry } from './data/roadmap.ts'
import { computePathProgress } from './data/state.ts'
import { useIntake } from './hooks/useIntake.ts'
import { useProgress } from './hooks/useProgress.ts'
import { useRoute } from './hooks/useRoute.ts'

/**
 * Root screen. No path and no level: the picker. Both, and not editing: the
 * roadmap, with a control that reopens the picker pre-filled.
 *
 * Progress is owned here, at the one mount point above both branches, and reaches
 * everything else through `ProgressContext`. The provider wraps the picker too,
 * which is what lets a learner import a progress file before choosing a path
 * rather than only after.
 *
 * Two sources of truth, split by what each one is for.
 *
 *   the URL          which path is on screen, and which quest is open. Place.
 *   `localStorage`   the level, the progress, the visited marks. Person.
 *
 * The URL wins on path, and that is the whole point of it: following
 * `#/builder/lora-qlora` from somebody else has to show you Model Builder, not
 * quietly show you your own path instead. It is written back to storage as it
 * goes, so a later visit with a bare URL returns to where you were.
 */
export default function App(): ReactNode {
  const { intake, setIntake } = useIntake()
  const progress = useProgress()
  const { route, push, replace, closeQuest } = useRoute()
  const [editing, setEditing] = useState(false)
  const [portabilityOpen, setPortabilityOpen] = useState(false)

  const level = intake?.level ?? null
  const pathId = route.path ?? intake?.path ?? null

  // Keep the two in step, in both directions, without either one fighting the
  // other: the URL states the path it does not have, and storage records the
  // path the URL just chose.
  useEffect(() => {
    if (pathId === null || level === null) return
    if (route.path === null) replace({ path: pathId, quest: null })
    else if (intake?.path !== route.path) setIntake({ path: route.path, level })
  }, [pathId, level, route.path, intake?.path, replace, setIntake])

  const applyImport = (imported: ImportedProgress): void => {
    progress.replaceProgress(imported.completed)
    // A file without a valid intake still imports its completions; the device
    // keeps the path and level it already had.
    if (imported.intake) {
      setIntake(imported.intake)
      setEditing(false)
    }
  }

  const portabilityControl = (
    <button
      type="button"
      className="progress-open"
      onClick={() => setPortabilityOpen(true)}
      aria-haspopup="dialog"
    >
      Progress file
    </button>
  )

  const panel = (
    <ProgressPanel
      open={portabilityOpen}
      onClose={() => setPortabilityOpen(false)}
      completed={progress.completed}
      intake={intake}
      onImport={applyImport}
      onReset={progress.resetProgress}
    />
  )

  if (pathId === null || level === null || editing) {
    return (
      <ProgressContext.Provider value={progress}>
        <Shell
          masthead={
            <>
              <span className="shell__masthead-meta">
                {registry.nodes.length} QUESTS / {registry.paths.length} PATHS
              </span>
              {portabilityControl}
            </>
          }
        >
          <PathPicker
            initialPath={pathId ?? undefined}
            initialLevel={intake?.level}
            onComplete={(state) => {
              setIntake(state)
              setEditing(false)
              // A quest deep-linked on the path just chosen survives the detour
              // through onboarding — which is the one visit where following
              // somebody's link would otherwise lose the thing they sent.
              const keep =
                route.quest !== null &&
                registry.nodesForPath(state.path).some((node) => node.id === route.quest)
              push({ path: state.path, quest: keep ? route.quest : null })
            }}
            // Only offered when there is a map to go back to. Reaching this
            // screen from "Change path" used to be one-way: no way out but to
            // answer both questions again.
            onCancel={intake ? () => setEditing(false) : undefined}
          />
          {panel}
        </Shell>
      </ProgressContext.Provider>
    )
  }

  const path = registry.getPath(pathId)
  // `RoadmapScreen` derives this again for the map itself. `computePathProgress` is
  // pure and runs over one path's nodes, so the second call is cheaper than lifting
  // the derivation past this branch — which cannot hold a hook.
  const { overall, percent, rank } = computePathProgress(path, progress.completed)
  const shipped = overall.total > 0 && overall.done === overall.total

  return (
    <ProgressContext.Provider value={progress}>
      <Shell
        masthead={
          <>
            <span
              className="shell__masthead-meta"
              data-shipped={shipped ? 'true' : undefined}
            >
              {rank.title} · {overall.xp} XP · {percent}%
            </span>
            {portabilityControl}
            <button type="button" className="intake-change" onClick={() => setEditing(true)}>
              Change path
            </button>
          </>
        }
      >
        <RoadmapScreen
          path={path}
          level={level}
          openId={route.quest}
          onOpenQuest={(quest) => push({ path: path.id, quest })}
          onCloseQuest={closeQuest}
        />
        {panel}
      </Shell>
    </ProgressContext.Provider>
  )
}
