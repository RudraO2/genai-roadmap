import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import type { ActProgress } from '../data/progress.ts'
import { usePathLength } from '../hooks/usePathLength.ts'
import { dashToFraction } from '../path/dash.ts'
import { PathContext } from '../path/PathContext.ts'
import { placePockets, type PocketPlacement } from '../path/pockets.ts'
import { pointAtT } from '../path/pointAtT.ts'
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
 * Card size, in CSS pixels, for a stage of `width` pixels. The solver and the
 * stylesheet both read these numbers — the solver as viewBox units, the card as
 * `--card-w`/`--card-h` — so they are computed once, here, rather than declared
 * twice and left to drift.
 *
 * 0.62 is the height ratio: enough for a level tag, a title, a three-line blurb
 * and the action row, and short enough that two cards stack inside one 420-unit
 * band with air between them. That second constraint is why the number is 0.62
 * and not 0.72 — at 0.72 a short act could not fit both of its cards in the band
 * between its two runs, and the solver had to put one of them on the road.
 *
 * Cards are uniform on purpose. It makes an act read as a deck of tickets rather
 * than a ransom note, and it is what lets the solver know a card's box before
 * React has laid it out.
 */
function cardSize(stageWidth: number): { w: number; h: number } {
  const w = Math.round(Math.min(272, Math.max(224, stageWidth * 0.2)))
  return { w, h: Math.round(w * 0.62) }
}

/** One road sample per ~10 viewBox units. See `hitsRoad` in pockets.ts. */
const ROAD_SAMPLE_UNITS = 10

/**
 * One act's `<svg>` and its single `<path>` — the load-bearing element
 * `CONTEXT.md` section 9 describes. Measures the path's total length once on
 * mount (SVG user-unit length, unaffected by container resize) and provides it
 * to every `PathNode` underneath via `PathContext`.
 *
 * Three strokes share that one geometry string, layered bottom to top: the road
 * (ink, full length), the stretch the learner has reached, and the stretch they
 * have walked, painted over it. Only the first path is measured; the other two
 * read the same `totalLength`, so there is no second measurement and no cloned
 * DOM node.
 *
 * ---- Where the cards go (spec 13) ----
 *
 * Cards are no longer positioned by each card from its own point. `placePockets`
 * decides all of them at once, because "no card covers the road" is a property of
 * the whole act and not of one card: a serpentine shares each band between two
 * runs, and the road loops back through the space it just left. The solver needs
 * three things this component owns — the sampled road, the measured stage width,
 * and the card's size in viewBox units — so the placement pass lives here and
 * `NodeCard` is handed a finished position.
 *
 * The stage width comes from a `ResizeObserver` on the `<svg>`'s wrapper. It is
 * the only measurement in the file, and it exists because a card is sized in CSS
 * pixels while the road is sized in viewBox units; something has to know the
 * ratio. Placement is recomputed when it changes, which is also what makes a
 * window drag re-solve rather than smear.
 *
 * Below 78rem the stylesheet drops the cards into a numbered list under the road
 * and ignores these positions entirely (`cards.css`). Placement is still computed
 * there — it costs one pass over at most seven nodes, and not computing it would
 * mean the layout depended on a media query being mirrored in JavaScript.
 *
 * Memoised, because the walker's tween sets a new `t` every frame and without it
 * all seven of a track's acts would re-render each of those frames.
 */
function ActPathImpl({ act, level, progress, characterT = null }: ActPathProps): ReactNode {
  const { pathRef, totalLength, contextValue } = usePathLength(act.path)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageWidth, setStageWidth] = useState(0)
  const { width: viewBoxWidth, height: viewBoxHeight } = useMemo(
    () => parseViewBoxSize(act.viewBox),
    [act.viewBox],
  )

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    setStageWidth(stage.clientWidth)
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width !== undefined) setStageWidth(Math.round(width))
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const card = useMemo(() => cardSize(stageWidth), [stageWidth])

  const placements = useMemo<Map<string, PocketPlacement>>(() => {
    const path = pathRef.current
    if (!path || totalLength === 0 || stageWidth === 0 || viewBoxWidth === 0) return new Map()

    // viewBox units per CSS pixel. The road is drawn in user units and the card
    // in pixels; this is the one conversion between them.
    const scale = viewBoxWidth / stageWidth
    const roadGauge = Number.parseFloat(
      getComputedStyle(path).getPropertyValue('stroke-width') || '34',
    )
    const roadHalf = (Number.isFinite(roadGauge) ? roadGauge : 34) / 2

    const samples = Math.max(2, Math.ceil(totalLength / ROAD_SAMPLE_UNITS))
    const road: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= samples; i += 1) {
      const p = path.getPointAtLength((totalLength * i) / samples)
      road.push({ x: p.x, y: p.y })
    }

    const inputs = act.nodes.map((placed) => ({
      point: pointAtT(path, totalLength, placed.t),
      side: placed.side,
    }))

    const solved = placePockets(inputs, {
      viewWidth: viewBoxWidth,
      viewHeight: viewBoxHeight,
      cardWidth: card.w * scale,
      cardHeight: card.h * scale,
      gap: roadHalf + 24,
      roadHalf,
      road,
    })

    return new Map(act.nodes.map((placed, i) => [placed.id, solved[i]!]))
  }, [act.nodes, card.h, card.w, pathRef, stageWidth, totalLength, viewBoxHeight, viewBoxWidth])

  // Read by both the card's own width/height and the solver, from one source.
  const cardVars = {
    '--card-w': `${card.w}px`,
    '--card-h': `${card.h}px`,
  } as CSSProperties

  return (
    <PathContext.Provider value={contextValue}>
      <div className="act-stage">
        <div className="act-stage__path" ref={stageRef}>
          <svg
            className="path-map"
            viewBox={act.viewBox}
            role="img"
            aria-label={`${act.title} path`}
          >
            {/* Four strokes, one geometry string, painted in this order:
                the ink casing, the stretch reached, the stretch walked over the
                top of it, and the dashed centre line over all three. What
                survives is one short bright segment between what is finished and
                where the learner is standing — the accent as "here", which is
                what section 8 reserves it for. */}
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
                <path className="path-map__centre" d={act.path} />
              </>
            )}
            {totalLength > 0 &&
              act.nodes.map((placed, i) => (
                <PathNode
                  key={placed.id}
                  placed={placed}
                  stop={i + 1}
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
          <div className="act-stage__cards" style={cardVars}>
            {act.nodes.map((placed, i) => (
              <NodeCard
                key={placed.id}
                placed={placed}
                stop={i + 1}
                placement={placements.get(placed.id) ?? null}
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
