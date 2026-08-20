import { useState, type ReactNode } from 'react'

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

/**
 * Root screen. No stored intake: the path picker. Stored intake and not editing:
 * the roadmap for the chosen path, with a control that reopens the picker
 * pre-filled.
 *
 * Progress is owned here, at the one mount point above both branches, and reaches
 * everything else through `ProgressContext`. The provider wraps the picker too,
 * which is what lets a learner import a progress file before choosing a path
 * rather than only after.
 */
export default function App(): ReactNode {
  const { intake, setIntake } = useIntake()
  const progress = useProgress()
  const [editing, setEditing] = useState(false)
  const [portabilityOpen, setPortabilityOpen] = useState(false)

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

  if (!intake || editing) {
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
            initialPath={intake?.path}
            initialLevel={intake?.level}
            onComplete={(state) => {
              setIntake(state)
              setEditing(false)
            }}
          />
          {panel}
        </Shell>
      </ProgressContext.Provider>
    )
  }

  const path = registry.getPath(intake.path)
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
        <RoadmapScreen path={path} level={intake.level} />
        {panel}
      </Shell>
    </ProgressContext.Provider>
  )
}
