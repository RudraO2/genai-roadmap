/**
 * Carries the current act's `<path>` ref and its measured total length down to
 * every `PathNode` under it, so each can call `usePathPoint` without the act
 * threading `x`/`y` through props — nodes never store position, only `t`.
 */

import { createContext, type RefObject } from 'react'

export interface PathContextValue {
  pathRef: RefObject<SVGPathElement | null>
  totalLength: number
}

export const PathContext = createContext<PathContextValue | null>(null)
