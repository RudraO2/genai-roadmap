import { memo, useMemo, type ReactNode } from 'react'

import type { BranchProgress } from '../data/progress.ts'
import { registry } from '../data/registry.ts'
import { usePathLength } from '../hooks/usePathLength.ts'
import { PathContext } from '../path/PathContext.ts'
import { parseViewBoxSize } from '../path/viewBox.ts'
import type { Branch, Level } from '../types.ts'
import { NodeCard } from './NodeCard.tsx'
import { PathNode } from './PathNode.tsx'

export interface BranchPathProps {
  branch: Branch
  level: Level
  /** This branch's slice of the derived progress. */
  progress: BranchProgress
}

/**
 * One frontier branch: a spur off a main-path node, drawn under the act that
 * holds that node.
 *
 * **Why it is a block below the act and not a line out of the anchor dot.** A
 * branch carries its own `viewBox` (`0 0 640 320`); an act's is `0 0 1200 760`.
 * The two share no coordinate space, so drawing the spur out of the anchor's
 * real point would mean inventing a transform between unrelated viewBoxes and
 * then fighting the act's card overlay for the same pixels — geometry that
 * breaks at the first viewport change. The attachment is stated instead: the
 * head names the anchor, and the anchor's own dot on the main path wears a ring
 * (`PathNode`'s `anchor` prop) saying a spur leaves from there.
 *
 * Unproven is drawn, not decorated. The stroke is the same `--rule` hairline as
 * the road, dashed — provisional at no cost in colour, so the accent stays
 * spent on where the learner is standing (CONTEXT.md section 8).
 *
 * Structure is deliberately the act's: `.act-stage`, `.act-stage__path` and
 * `.act-stage__cards`, plus a `--branch` modifier. The cards do not float in
 * the spur's pockets, though — `branch.css` stacks them below it at every
 * width, because a 640x320 box cannot hold four cards without overlap and the
 * largest spur in the registry places seven. The spur is the diagram; the
 * cards are the list. The full argument is at the rule that does it.
 *
 * Memoised for the same reason `ActPath` is: `TrackMap` re-renders on every
 * frame of the walker's tween and a branch has nothing to do with the walker.
 * Its props are referentially stable — `branch` from the frozen registry,
 * `progress` from `TrackMap`'s one `useMemo`.
 */
function BranchPathImpl({ branch, level, progress }: BranchPathProps): ReactNode {
  const { pathRef, totalLength, contextValue } = usePathLength(branch.path)
  const { width: viewBoxWidth, height: viewBoxHeight } = useMemo(
    () => parseViewBoxSize(branch.viewBox),
    [branch.viewBox],
  )

  const anchor = registry.getNode(branch.anchor)

  return (
    <PathContext.Provider value={contextValue}>
      <section className="branch">
        <header className="branch__head">
          <p className="branch__kicker">
            <span>Frontier</span>
            <span className="branch__unproven">Unproven</span>
          </p>
          <h3 className="branch__title">{branch.title}</h3>
          <p className="branch__meta">
            Spur from {anchor.title} — {progress.done} / {progress.total} explored
          </p>
        </header>

        <div className="act-stage act-stage--branch">
          <div className="act-stage__path">
            <svg
              className="path-map branch-map"
              viewBox={branch.viewBox}
              role="img"
              aria-label={`${branch.title} frontier branch, spurring off ${anchor.title}`}
            >
              <path ref={pathRef} className="branch-map__line" d={branch.path} />
              {totalLength > 0 &&
                branch.nodes.map((placed) => (
                  <PathNode
                    key={placed.id}
                    placed={placed}
                    state={progress.states.get(placed.id) ?? 'ahead'}
                  />
                ))}
            </svg>
          </div>
          {totalLength > 0 && (
            <div className="act-stage__cards">
              {/* `NodeCard` still positions itself from its point; `branch.css`
                  overrides that with static flow. The viewBox props stay so the
                  card has one contract wherever it is used. */}
              {branch.nodes.map((placed) => (
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
      </section>
    </PathContext.Provider>
  )
}

export const BranchPath = memo(BranchPathImpl)
