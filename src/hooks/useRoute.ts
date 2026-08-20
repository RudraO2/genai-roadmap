import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatRoute, readRoute, type Route } from '../data/route.ts'

/** Marks a history entry this app pushed, so `close` knows whether Back is safe. */
interface RouteHistoryState {
  pushed: true
}

export interface UseRoute {
  route: Route
  /** A new place: adds a history entry, so Back returns to the last one. */
  push: (route: Route) => void
  /** The same place, said correctly: no history entry. */
  replace: (route: Route) => void
  /**
   * Leave the current quest. Steps back when this app pushed the entry, which
   * keeps the history stack from growing by one for every quest opened and
   * makes Back and the Close button do the same thing. On an entry we did not
   * push — someone opening a shared quest link directly — stepping back would
   * leave the site, so that case rewrites the URL instead.
   */
  closeQuest: () => void
}

/**
 * The URL as React state, in both directions.
 *
 * Reading: `popstate` covers Back and Forward, `hashchange` covers a hash typed
 * or pasted into the address bar. Neither fires for our own `pushState` or
 * `replaceState`, which is exactly what makes this loop-free — a write sets the
 * state itself, and the listeners only ever hear about navigations we did not
 * perform.
 *
 * Writing: pushing is reserved for opening a quest and for choosing a path,
 * which are the two things a learner would recognise as "somewhere else".
 * Everything else replaces, because a Back button that walks through your own
 * filter changes is a Back button people stop trusting.
 */
export function useRoute(): UseRoute {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const sync = (): void => setRoute(readRoute())
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    // A hash can change between first render and this effect attaching.
    sync()
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const push = useCallback((next: Route) => {
    // Pushing the URL that is already showing would put two identical entries
    // on the stack, and `closeQuest`'s Back would then land on the quest it was
    // trying to leave. It happens for real: following a quest link with no
    // level stored routes you through onboarding, which finishes by pushing the
    // very address you arrived at.
    if (formatRoute(next) === window.location.hash) {
      setRoute(next)
      return
    }
    const state: RouteHistoryState = { pushed: true }
    window.history.pushState(state, '', formatRoute(next))
    setRoute(next)
  }, [])

  const replace = useCallback((next: Route) => {
    window.history.replaceState(window.history.state, '', formatRoute(next))
    setRoute(next)
  }, [])

  const closeQuest = useCallback(() => {
    const state = window.history.state as RouteHistoryState | null
    if (state?.pushed === true) {
      // `popstate` fires and the listener above reads the URL back out, so the
      // dialog closes through the same path a hardware Back button uses.
      window.history.back()
      return
    }
    setRoute((current) => {
      const next: Route = { path: current.path, quest: null }
      window.history.replaceState(window.history.state, '', formatRoute(next))
      return next
    })
  }, [])

  return useMemo(() => ({ route, push, replace, closeQuest }), [route, push, replace, closeQuest])
}
