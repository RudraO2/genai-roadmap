import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { PathContext } from '../path/PathContext.ts'
import type { Act } from '../types.ts'
import { PathNode } from './PathNode.tsx'

export interface ActPathProps {
  act: Act
}

/**
 * One act's `<svg>` and its single `<path>` — the load-bearing element
 * `CONTEXT.md` section 9 describes. Measures the path's total length once on
 * mount (SVG user-unit length, unaffected by container resize) and provides it
 * to every `PathNode` underneath via `PathContext`.
 */
export function ActPath({ act }: ActPathProps): ReactNode {
  const pathRef = useRef<SVGPathElement | null>(null)
  const [totalLength, setTotalLength] = useState(0)

  useLayoutEffect(() => {
    setTotalLength(pathRef.current?.getTotalLength() ?? 0)
  }, [act.path])

  const contextValue = useMemo(() => ({ pathRef, totalLength }), [totalLength])

  return (
    <PathContext.Provider value={contextValue}>
      <svg className="path-map" viewBox={act.viewBox} role="img" aria-label={`${act.title} path`}>
        <path ref={pathRef} className="path-map__line" d={act.path} />
        {totalLength > 0 && act.nodes.map((placed) => <PathNode key={placed.id} placed={placed} />)}
      </svg>
    </PathContext.Provider>
  )
}
