import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { clearVisited, loadVisited, saveVisited } from '../data/visited.ts'

export interface UseVisited {
  visited: ReadonlySet<string>
  /** Idempotent: re-opening a quest already marked does not re-render. */
  markVisited: (id: string) => void
  resetVisited: () => void
}

/**
 * Wraps `data/visited.ts` in React state. Same persistence shape as
 * `useProgress`: the write is an effect and skips a set it has already written,
 * so `StrictMode`'s second mount pass cannot create the key on its own.
 */
export function useVisited(): UseVisited {
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => loadVisited())
  const persisted = useRef<ReadonlySet<string> | null>(null)
  if (persisted.current === null) persisted.current = visited

  useEffect(() => {
    if (persisted.current === visited) return
    persisted.current = visited
    saveVisited(visited)
  }, [visited])

  const markVisited = useCallback((id: string) => {
    setVisited((current) => (current.has(id) ? current : new Set([...current, id])))
  }, [])

  const resetVisited = useCallback(() => {
    clearVisited()
    setVisited(new Set())
  }, [])

  return useMemo(
    () => ({ visited, markVisited, resetVisited }),
    [visited, markVisited, resetVisited],
  )
}
