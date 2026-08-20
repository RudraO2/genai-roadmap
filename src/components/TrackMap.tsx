import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { useProgressContext } from '../data/ProgressContext.ts'
import {
  actIndexOf,
  actRefOf,
  actViewOf,
  initialView,
  neighbourActs,
  OVERVIEW_VIEW,
  padIndex,
  resolveAct,
  type ActView,
} from '../data/navigation.ts'
import {
  computeTrackProgress,
  EMPTY_ACT_PROGRESS,
  EMPTY_BRANCH_PROGRESS,
  type CharacterPlacement,
} from '../data/progress.ts'
import { useTweenedT } from '../hooks/useTweenedT.ts'
import type { Level, Track } from '../types.ts'
import { ActNav } from './ActNav.tsx'
import { ActPager } from './ActPager.tsx'
import { ActPath } from './ActPath.tsx'
import { BranchPath } from './BranchPath.tsx'
import { Overview } from './Overview.tsx'
import { Section } from './Section.tsx'

export type { CharacterPlacement }

export interface TrackMapProps {
  track: Track
  level: Level
  /**
   * Which act hosts the walker, and where on it. Defaults to the learner's
   * progress frontier — the first act holding an unfinished node, at that act's
   * revealed position. Pass this to override that, as spec 07 did before there
   * was any progress to read.
   */
  character?: CharacterPlacement
}

/**
 * The map. Either the zoomed-out overview or exactly one act — never the whole
 * track at once, which is `CONTEXT.md` section 9's "each act is its own
 * serpentine screen" and, before spec 10, a scroll several metres long.
 *
 * An act screen is its `Section`, its `ActPath`, and the frontier branches whose
 * `act` names it (spec 09) in `track.branches` order, framed by the nav strip
 * above and the pager below. Exactly one act renders a `Character` — every other
 * gets `characterT` null, and no branch ever gets one: the walker stands on the
 * road, not on a side trip.
 *
 * Progress is derived here, once, by `computeTrackProgress`, and handed down as
 * each act's slice. No component counts completions of its own, so the fog, the
 * dots, the cards, the walker and the overview's tallies cannot drift apart.
 *
 * The walker's `t` is tweened rather than assigned: the figure walks to the new
 * frontier when a node is marked done. That is also what starts its bob —
 * `useWalking` watches `t` for changes and needs no flag from here.
 *
 * **Marking a node done never moves the view.** Finishing the last node of the
 * act on screen advances the learner's frontier to the next act; the screen
 * stays where the learner put it and `ActNav` starts offering the jump. A screen
 * that navigates itself out from under a pointer is worse than a stale one.
 *
 * `actCleared` and `shipped` (spec 14) are read off the same `progress` this
 * component already derives — no second count, so the badge and the tally it
 * summarises can never disagree. Both exclude frontier by construction, because
 * `progress.done` / `progress.total` already do (spec 09): a side trip left
 * unexplored can never block, or fake, either one.
 */
export function TrackMap({ track, level, character }: TrackMapProps): ReactNode {
  const { completed } = useProgressContext()
  const progress = useMemo(() => computeTrackProgress(track, completed), [track, completed])

  const target = character ?? progress.placement

  // Initialised once, from wherever the walker stands at mount — the override
  // included, so a caller that places the figure by hand opens on the act it is
  // standing in rather than on an act with no figure. Lazy on purpose: the
  // placement moves as nodes are marked done, and the view must not follow it.
  const [view, setView] = useState<ActView>(() => initialView(track, target))
  const screenRef = useRef<HTMLDivElement | null>(null)
  const moveFocus = useRef(false)

  const walkerT = useTweenedT(target?.t ?? 0, `${track.id}:${target?.actId ?? 'none'}`)

  // Navigation lands the reader on the new screen: scrolled to its top, with
  // focus inside it, so the next Tab continues from here rather than from the
  // control they just left — which no longer exists on this screen. Gated on a
  // flag set by the handlers, so the first mount neither scrolls nor steals
  // focus from the page.
  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    window.scrollTo({ top: 0 })
    screenRef.current?.focus({ preventScroll: true })
  }, [view])

  const navigate = useCallback((next: ActView) => {
    moveFocus.current = true
    setView(next)
  }, [])
  const selectAct = useCallback((actId: string) => navigate(actViewOf(actId)), [navigate])
  const showOverview = useCallback(() => navigate(OVERVIEW_VIEW), [navigate])

  // Null for the overview, and null too for an act id this track does not hold —
  // so a view carried over from another track falls back to the overview rather
  // than rendering an empty screen.
  const act = resolveAct(track, view)

  // Whole-track "shipped": every main-zone node done, at least one placed.
  // Frontier is excluded by construction — `progress.done` / `progress.total`
  // already never fold it in (spec 09) — so a side trip left unexplored can
  // never block or fake this.
  const shipped = progress.total > 0 && progress.done === progress.total

  if (!act) {
    return (
      <div className="map-screen" ref={screenRef} tabIndex={-1}>
        <Overview
          track={track}
          progress={progress}
          standingActId={target?.actId ?? null}
          onSelectAct={selectAct}
          shipped={shipped}
        />
      </div>
    )
  }

  const index = actIndexOf(track, act.id)
  const { prev, next } = neighbourActs(track, act.id)
  // Only when the learner is standing somewhere else: on the act they are on,
  // the walker is already on screen and the control would point at itself.
  // Read off `target`, the same value the figure is drawn from, so the label and
  // the figure can never name different acts.
  const standingId = target?.actId ?? null
  const standing = standingId && standingId !== act.id ? actRefOf(track, standingId) : null

  const actProgress = progress.acts.get(act.id) ?? EMPTY_ACT_PROGRESS
  // Same reasoning as `shipped`, one level down: an act with no nodes at all
  // (a placeholder, or one whose only content is a branch) never reads as
  // cleared, and the badge does not exist in the DOM until this is first true —
  // see the note at `Section.badge`.
  const actCleared = actProgress.total > 0 && actProgress.done === actProgress.total

  return (
    <div className="map-screen" ref={screenRef} tabIndex={-1}>
      <ActNav
        index={index + 1}
        count={track.acts.length}
        onOverview={showOverview}
        standing={standing}
        onSelectAct={selectAct}
      />
      <Section
        index={padIndex(index + 1)}
        kicker={track.title}
        title={act.title}
        standfirst={act.subtitle}
        badge={actCleared ? <span className="section__badge">Act cleared</span> : null}
      >
        <ActPath
          act={act}
          level={level}
          progress={actProgress}
          characterT={target && target.actId === act.id ? walkerT : null}
        />
        {track.branches
          // A branch with no nodes draws a spur to nowhere and a "0 / 0" tally.
          // `validate.ts` warns on it (`EMPTY_BRANCH`) so it is reported rather
          // than silently dropped here.
          .filter((branch) => branch.act === act.id && branch.nodes.length > 0)
          .map((branch) => (
            <BranchPath
              key={branch.id}
              branch={branch}
              level={level}
              progress={progress.branches.get(branch.id) ?? EMPTY_BRANCH_PROGRESS}
            />
          ))}
      </Section>
      {/* A one-act track has nowhere to page to, and an empty bar with a rule
          above it would still look like a control. */}
      {prev || next ? <ActPager prev={prev} next={next} onSelectAct={selectAct} /> : null}
    </div>
  )
}
