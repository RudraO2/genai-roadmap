import { memo, useMemo, type ReactNode } from 'react'

import type { ActProgress } from '../data/progress.ts'
import { usePathLength } from '../hooks/usePathLength.ts'
import { dashToFraction } from '../path/dash.ts'
import { PathContext } from '../path/PathContext.ts'
import { parseViewBoxSize } from '../path/viewBox.ts'
import type { Act, Level } from '../types.ts'
import { Character } from './Character.tsx'
import { NodeCard } from './NodeCard.tsx'
import { PathNode } from './PathNode.tsx'

export interface ActPathProps {
  act: Act
  level: Level
  /** This act's slice of the derived progress (spec 08). */
  progress: ActProgress
  /** `t` of the walker, when this act is the one hosting it (spec 07). */
  characterT?: number | null
}

/**
 * One act's `<svg>` and its single `<path>` — the load-bearing element
 * `CONTEXT.md` section 9 describes. Measures the path's total length once on
 * mount (SVG user-unit length, unaffected by container resize) and provides it
 * to every `PathNode`/`NodeCard` underneath via `PathContext`.
 *
 * Three strokes share that one geometry string, layered bottom to top: the road
 * (`--rule`, full length), the stretch the learner has reached (`--accent`,
 * clipped to `revealT`), and the stretch they have walked (`--accent-quiet`,
 * clipped to `completeT`) painted over it. What survives is one short bright
 * segment between the two — the learner's position. Only the first path is
 * measured; the other two read the same `totalLength`, so there is no second
 * measurement and no cloned DOM node.
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
 *
 * Memoised, because the walker's tween sets a new `t` every frame and without
 * it all seven of a track's acts would re-render each of those frames. Its
 * props are all referentially stable between tweens: `act` comes from the
 * frozen registry, `progress` from one `useMemo` in `TrackMap`, and only the
 * hosting act's `characterT` changes mid-walk. Measured mid-walk on the `game`
 * track at 45fps without it and 56fps with it, against 62fps idle.
 */
function ActPathImpl({ act, level, progress, characterT = null }: ActPathProps): ReactNode {
  const { pathRef, totalLength, contextValue } = usePathLength(act.path)
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
            {totalLength > 0 && (
              <>
                <path
                  className="path-map__reached"
                  d={act.path}
                  style={dashToFraction(totalLength, progress.revealT)}
                />
                <path
                  className="path-map__walked"
                  d={act.path}
                  style={dashToFraction(totalLength, progress.completeT)}
                />
              </>
            )}
            {totalLength > 0 &&
              act.nodes.map((placed) => (
                <PathNode
                  key={placed.id}
                  placed={placed}
                  state={progress.states.get(placed.id) ?? 'ahead'}
                  anchor={progress.anchors.has(placed.id)}
                />
              ))}
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

export const ActPath = memo(ActPathImpl)
