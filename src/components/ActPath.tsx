import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { PathContext } from '../path/PathContext.ts'
import { parseViewBoxSize } from '../path/viewBox.ts'
import type { Act, Level } from '../types.ts'
import { Character } from './Character.tsx'
import { NodeCard } from './NodeCard.tsx'
import { PathNode } from './PathNode.tsx'

export interface ActPathProps {
  act: Act
  level: Level
  /** `t` of the walker, when this act is the one hosting it (spec 07). */
  characterT?: number | null
}

/**
 * One act's `<svg>` and its single `<path>` — the load-bearing element
 * `CONTEXT.md` section 9 describes. Measures the path's total length once on
 * mount (SVG user-unit length, unaffected by container resize) and provides it
 * to every `PathNode`/`NodeCard` underneath via `PathContext`.
 *
 * The character (spec 07) sits in `.act-stage__path`, a wrapper around the
 * `<svg>` alone. It cannot share the card overlay: below 640px the cards drop
 * to static flow, which both makes a walker inside them a flex item and grows
 * `.act-stage` past the svg's own height — percentages of the stage would then
 * put the character below the path it is meant to stand on.
 *
 * The card overlay is a sibling `<div>`, not SVG — cards need real HTML for
 * text wrapping and buttons. It shares `.act-stage`'s box with the `<svg>`
 * (auto height, set by the svg) so percentage positions line up with the
 * rendered path without a second size measurement.
 */
export function ActPath({ act, level, characterT = null }: ActPathProps): ReactNode {
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
        <div className="act-stage__path">
          <svg className="path-map" viewBox={act.viewBox} role="img" aria-label={`${act.title} path`}>
            <path ref={pathRef} className="path-map__line" d={act.path} />
            {totalLength > 0 && act.nodes.map((placed) => <PathNode key={placed.id} placed={placed} />)}
          </svg>
          {totalLength > 0 && characterT !== null && (
            <div className="act-stage__character" aria-hidden="true">
              <Character
                t={characterT}
                viewBoxWidth={viewBoxWidth}
                viewBoxHeight={viewBoxHeight}
              />
            </div>
          )}
        </div>
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
