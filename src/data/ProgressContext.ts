/**
 * Carries the completed-node set and its toggle down to every card, the fog
 * geometry and the walker, so all three read one set.
 *
 * Same split as `path/PathContext.ts` / `hooks/usePathPoint.ts`: the context
 * object and its reader live here, the state that fills it lives in
 * `hooks/useProgress.ts`. Lifting completion into props instead would mean
 * threading a setter through `ActPath`, which owns none of this state and only
 * passes it along.
 */

import { createContext, useContext } from 'react'

export interface ProgressContextValue {
  completed: ReadonlySet<string>
  toggle: (id: string) => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

/**
 * Throws outside a provider rather than falling back to an empty set: a card
 * that silently reported nothing complete, and silently dropped every click,
 * is a bug that would look like working software.
 */
export function useProgressContext(): ProgressContextValue {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgressContext must be used inside a ProgressContext.Provider')
  return value
}
