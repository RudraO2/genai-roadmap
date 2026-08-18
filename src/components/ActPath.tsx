import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { PathContext } from '../path/PathContext.ts'
import { parseViewBoxSize } from '../path/viewBox.ts'
import type { Act, Level } from '../types.ts'
import { NodeCard } from './NodeCard.tsx'
import { PathNode } from './PathNode.tsx'

export interface ActPathProps {
  act: Act
  level: Level
}

/**
 * One act's `<svg>` and its single `<path>` — the load-bearing element
 * `CONTEXT.md` section 9 describes. Measures the path's total length once on
 * mount (SVG user-unit length, unaffected by container resize) and provides it
 * to every `PathNode`/`NodeCard` underneath via `PathContext`.
 *
 * The card overlay is a sibling `<div>`, not SVG — cards need real HTML for
 * text wrapping and buttons. It shares `.act-stage`'s box with the `<svg>`
 * (auto height, set by the svg) so percentage positions line up with the
 * rendered path without a second size measurement.
 */
export function ActPath({ act, level }: ActPathProps): ReactNode {
  const pathRef = useRef<SVGPathElement | null>(null)
  const [totalLength, setTotalLength] = useState(0)

  useLayoutEffect(() => {
    setTotalLength(pathRef.current?.getTotalLength() ?? 0)
  }, [act.path])

  const contextValue = useMemo(() => ({ pathRef, totalLength }), [totalLength])
  const { width: viewBoxWidth, height: viewBoxHeight } = useMemo(
    () => parseViewBoxSize(act.viewBox),
    [act.viewBox],
  )

  return (
    <PathContext.Provider value={contextValue}>
      <div className="act-stage">
        <svg className="path-map" viewBox={act.viewBox} role="img" aria-label={`${act.title} path`}>
          <path ref={pathRef} className="path-map__line" d={act.path} />
          {totalLength > 0 && act.nodes.map((placed) => <PathNode key={placed.id} placed={placed} />)}
        </svg>
        {totalLength > 0 && (
          <div className="act-stage__cards">
            {act.nodes.map((placed) => (
              <NodeCard
                key={placed.id}
                placed={placed}
                viewBoxWidth={viewBoxWidth}
                viewBoxHeight={viewBoxHeight}
                learnerLevel={level}
              />
            ))}
          </div>
        )}
      </div>
    </PathContext.Provider>
  )
}
