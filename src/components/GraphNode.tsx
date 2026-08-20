import type { CSSProperties, ReactNode } from 'react'

import { TYPE_LABEL } from '../constants.ts'
import type { LaidNode } from '../data/layout.ts'
import type { LevelFit } from '../data/state.ts'
import { useJustCompleted } from '../hooks/useJustCompleted.ts'
import type { NodeState } from '../types.ts'

export interface GraphNodeProps {
  laid: LaidNode
  state: NodeState
  /** True for the one node the "do this next" banner is pointing at. */
  isNext: boolean
  /** True when a search is running and this node is not a match. */
  dimmed: boolean
  /** True once this quest has been opened, on this browser, ever. */
  visited: boolean
  /** True for the quest opened most recently — the place you were last. */
  focused: boolean
  /** How this quest sits against the level the learner chose. */
  fit: LevelFit
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}

const STATE_LABEL: Readonly<Record<NodeState, string>> = {
  done: 'Done',
  ready: 'Ready',
  locked: 'Locked',
}

/**
 * One box on the map.
 *
 * The whole card is the button that opens the quest, because a card you have to
 * aim at a small link inside is a card people stop clicking. The tick beside it is
 * a second, separate control: marking something done should not cost a dialog.
 *
 * A locked node is dimmed and says so, but it is never hidden and never
 * unclickable. Seeing what is coming, and what it is waiting for, is most of the
 * value of having a map at all.
 *
 * Three marks answer "where was I" rather than "what is this":
 *
 *   visited   this quest has been opened before, so a return visit can tell
 *             the ninety-four boxes apart
 *   focused   this is the one opened most recently. It survives the dialog
 *             closing, which is the whole point — closing a panel should not
 *             erase the only record of where you had got to
 *   fit       review or stretch, relative to the level given at intake. Advice
 *             printed on the card; it never removes or disables anything
 *
 * `useJustCompleted` is true for one animation only, on the click that actually
 * finishes a quest — not on mount with it already done, and not on un-marking it.
 * That is what keeps the stamp inside "motion only to show a state change": a map
 * loading with forty quests done must not put on a fireworks display.
 */
export function GraphNode({
  laid,
  state,
  isNext,
  dimmed,
  visited,
  focused,
  fit,
  onOpen,
  onToggle,
}: GraphNodeProps): ReactNode {
  const { node, box } = laid
  const justCompleted = useJustCompleted(state === 'done')
  const position: CSSProperties = {
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.w}px`,
    height: `${box.h}px`,
  }

  return (
    <div
      // The scroll target. Jumping here from a search hit or a prerequisite
      // chip is a document-order lookup rather than a ref map, because only one
      // of the two views is ever mounted and the id is therefore unique.
      id={`quest-${node.id}`}
      className="qnode"
      style={position}
      data-state={state}
      data-type={node.type}
      data-level={node.level}
      data-next={isNext ? 'true' : undefined}
      data-visited={visited ? 'true' : undefined}
      data-focused={focused ? 'true' : undefined}
      data-dimmed={dimmed ? 'true' : undefined}
      data-just-completed={justCompleted ? 'true' : undefined}
    >
      <button
        type="button"
        className="qnode__open"
        onClick={() => onOpen(node.id)}
        aria-label={`Open quest: ${node.title}${visited ? ' (opened before)' : ''}`}
      >
        <span className="qnode__kicker">
          <span className="qnode__type">{TYPE_LABEL[node.type]}</span>
          {fit === 'match' ? null : <span className="qnode__fit">{fit}</span>}
          <span className="qnode__est">{node.est}</span>
        </span>
        <span className="qnode__title">{node.title}</span>
        <span className="qnode__foot">
          <span className="qnode__state">
            {focused ? 'Last opened' : isNext ? 'Do this next' : STATE_LABEL[state]}
          </span>
          <span className="qnode__xp">{node.xp} XP</span>
        </span>
      </button>
      {visited && state !== 'done' ? (
        <span className="qnode__seen" title="You have opened this quest" aria-hidden="true" />
      ) : null}
      <button
        type="button"
        className="qnode__tick"
        aria-pressed={state === 'done'}
        aria-label={state === 'done' ? `Mark ${node.title} not done` : `Mark ${node.title} done`}
        onClick={() => onToggle(node.id)}
      >
        <span aria-hidden="true">{state === 'done' ? '✓' : ''}</span>
      </button>
    </div>
  )
}
