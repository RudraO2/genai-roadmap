/**
 * Reads the enclosing act's path out of `PathContext` and returns the point at
 * `t` on it. `null` until the path is mounted and measured — callers must gate
 * on that rather than rendering a stale or zeroed position.
 */

import { useContext, useMemo } from 'react'

import { PathContext } from '../path/PathContext.ts'
import { pointAtT, type PathPoint } from '../path/pointAtT.ts'

export function usePathPoint(t: number): PathPoint | null {
  const ctx = useContext(PathContext)

  return useMemo(() => {
    if (!ctx || !ctx.pathRef.current || ctx.totalLength === 0) return null
    return pointAtT(ctx.pathRef.current, ctx.totalLength, t)
  }, [ctx, t])
}
