import { useEffect, useState, type ReactNode } from 'react'
import { Home } from './components/Home.tsx'
import { PathPicker } from './components/PathPicker.tsx'
import { ProgressPanel } from './components/ProgressPanel.tsx'
import { RoadmapScreen } from './components/RoadmapScreen.tsx'
import { Shell } from './components/Shell.tsx'
import type { ImportedProgress } from './data/portability.ts'
import { ProgressContext } from './data/ProgressContext.ts'
import { registry } from './data/roadmap.ts'
import { useIntake } from './hooks/useIntake.ts'
import { useProgress } from './hooks/useProgress.ts'
import { useRoute } from './hooks/useRoute.ts'
import type { Level, PathId } from './types.ts'

export default function App(): ReactNode {
  const { intake, setIntake } = useIntake()
  const progress = useProgress()
  const { route, push, replace } = useRoute()
  const [portabilityOpen, setPortabilityOpen] = useState(false)
  const level = intake?.level ?? 'beginner'
  const page = route.path ? 'learning' : route.page === 'courses' ? 'courses' : 'home'
  useEffect(() => {
    if (route.path && route.path !== intake?.path) setIntake({ path: route.path, level })
  }, [route.path, intake?.path, level, setIntake])
  useEffect(() => {
    if (!route.quest) window.scrollTo({ top: 0 })
    const label = route.path ? registry.getPath(route.path).title : page === 'courses' ? 'Courses' : 'Learn AI, one step at a time'
    document.title = `${label} · The Gen AI Roadmap`
  }, [route.path, route.quest, page])
  const start = (path: PathId, startingLevel: Level = level): void => {
    setIntake({ path, level: startingLevel })
    push({ path, quest: null })
  }
  const applyImport = (imported: ImportedProgress): void => {
    progress.replaceProgress(imported.completed)
    if (imported.intake) {
      setIntake(imported.intake)
      push({ path: imported.intake.path, quest: null })
    }
  }
  return <ProgressContext.Provider value={progress}>
    <Shell activePage={page} learningPath={intake?.path ?? 'explorer'} masthead={
      <details className="site-tools"><summary>My progress</summary><div className="site-tools__menu">
        <p>Your progress saves on this browser.</p>
        <button type="button" onClick={() => setPortabilityOpen(true)}>Save or restore progress</button>
        {route.path ? <button type="button" onClick={() => window.print()}>Print course checklist</button> : null}
      </div></details>
    }>
      {page === 'home' ? <Home intake={intake} onStart={start} /> : page === 'courses' ?
        <PathPicker initialPath={intake?.path} initialLevel={level} onComplete={(state) => start(state.path, state.level)} /> : route.path ?
          <RoadmapScreen key={route.path} path={registry.getPath(route.path)} level={level} openId={route.quest}
            onLevelChange={(value) => setIntake({ path: route.path!, level: value })}
            onOpenQuest={(quest) => push({ path: route.path, quest })}
            onCloseQuest={() => replace({ path: route.path, quest: null })} /> : null}
      <ProgressPanel open={portabilityOpen} onClose={() => setPortabilityOpen(false)} completed={progress.completed}
        intake={intake} onImport={applyImport} onReset={progress.resetProgress} />
    </Shell>
  </ProgressContext.Provider>
}
