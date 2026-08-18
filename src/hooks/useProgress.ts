/**
 * Wraps `data/progress.ts`'s storage in React state so a write re-renders
 * without a reload. Same shape as `useIntake`.
 *
 * One instance owns the set for the whole app (mounted in `App`), and everything
 * else reads it through `ProgressContext`. A second instance would give two
 * components two copies of the same truth.
 *
 * The write is an effect, not a line inside the state updater: `StrictMode`
 * double-invokes updaters to catch impure ones, and a `localStorage` write is
 * exactly the kind of side effect that check looks for. The effect persists
 * only a set it has not already persisted, so `StrictMode`'s second mount pass
 * does not write the loaded value straight back — opening the app without
 * touching anything never creates the key.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { clearCompleted, loadCompleted, saveCompleted } from '../data/progress.ts'

export interface UseProgress {
  completed: ReadonlySet<string>
  toggle: (id: string) => void
  resetProgress: () => void
}

export function useProgress(): UseProgress {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(() => loadCompleted())
  const persisted = useRef<ReadonlySet<string> | null>(null)
  // Lazy ref init during render — the one mutation React sanctions here.
  if (persisted.current === null) persisted.current = completed

  useEffect(() => {
    if (persisted.current === completed) return
    persisted.current = completed
    saveCompleted(completed)
  }, [completed])

  const toggle = useCallback((id: string) => {
    setCompleted((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    clearCompleted()
    // The effect above rewrites the (now empty) key. Harmless, and it keeps one
    // writer rather than two paths that could disagree about the shape stored.
    setCompleted(new Set())
  }, [])

  return useMemo(() => ({ completed, toggle, resetProgress }), [completed, toggle, resetProgress])
}
