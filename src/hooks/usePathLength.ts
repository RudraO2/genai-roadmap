/**
 * Measure one `<path>` once, on mount, and package it as the value
 * `PathContext` wants.
 *
 * This is the logic spec 04 put inline in `ActPath`, lifted the moment a second
 * path needed it (spec 09's frontier branch). `getTotalLength` returns SVG user
 * units, so the measurement is unaffected by container resize and re-runs only
 * when the geometry string itself changes.
 *
 * `totalLength` is 0 until the layout effect has run. Callers gate rendering on
 * it: every position under a path comes from `getPointAtLength(total * t)`, and
 * a total of 0 would stack every node at the path's start for one frame.
 */

import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

import type { PathContextValue } from '../path/PathContext.ts'

export interface PathMeasure {
  pathRef: RefObject<SVGPathElement | null>
  totalLength: number
  /** Referentially stable between measurements. Hand straight to the provider. */
  contextValue: PathContextValue
}

export function usePathLength(d: string): PathMeasure {
  const pathRef = useRef<SVGPathElement | null>(null)
  const [totalLength, setTotalLength] = useState(0)

  useLayoutEffect(() => {
    setTotalLength(pathRef.current?.getTotalLength() ?? 0)
  }, [d])

  const contextValue = useMemo(() => ({ pathRef, totalLength }), [totalLength])

  return { pathRef, totalLength, contextValue }
}
