import { useEffect, useState } from 'react'

/**
 * Subscribe to a media query. Used to choose between the map and the list rather
 * than to hide one with CSS: the map is absolutely positioned from a computed
 * layout, so on a narrow screen the right answer is not to shrink it but to render
 * something else entirely.
 *
 * Defaults to false during the first render, which is the correct guess for a
 * min-width query on a server or a very small screen; the effect corrects it on
 * mount before paint matters.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const list = window.matchMedia(query)
    setMatches(list.matches)
    const onChange = (event: MediaQueryListEvent): void => setMatches(event.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
