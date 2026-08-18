import type { ReactNode } from 'react'

import { padIndex } from '../data/navigation.ts'
import { EMPTY_ACT_PROGRESS, type ActProgress, type TrackProgress } from '../data/progress.ts'
import { usePathLength } from '../hooks/usePathLength.ts'
import { dashToFraction } from '../path/dash.ts'
import type { Act, Track } from '../types.ts'
import { Section } from './Section.tsx'

export interface OverviewProps {
  track: Track
  /** Derived once in `TrackMap`. Nothing here counts anything of its own. */
  progress: TrackProgress
  /**
   * The act the walker is standing in — the same value the act screen's own
   * "you are in" control reads, so the two screens cannot disagree about where
   * the learner is. Null when the track places nothing.
   */
  standingActId: string | null
  onSelectAct: (actId: string) => void
}

/**
 * One act's serpentine, drawn small.
 *
 * The same `path` string the full-size act draws, measured through the same
 * `usePathLength` hook, clipped by the same `dashToFraction` — so a miniature
 * cannot say the learner is further along than the act itself does. It carries
 * no dots and no labels: at this size a 1200-unit act cannot hold six legible
 * dots, and the row's tally beside it says what the dots would have.
 *
 * The stroke is widened in `navigation.css`, in the path's own user units — the
 * act's own 2-unit hairline drawn this small is a third of a pixel and the road
 * vanishes. It has to be user units and not a device-space width, because the
 * dash clip above is in user units and the two must share a space.
 */
function ActMini({ act, progress }: { act: Act; progress: ActProgress }): ReactNode {
  const { pathRef, totalLength } = usePathLength(act.path)

  return (
    <svg className="overview-map" viewBox={act.viewBox} aria-hidden="true">
      <path ref={pathRef} className="overview-map__line" d={act.path} />
      {totalLength > 0 && (
        <>
          <path
            className="overview-map__reached"
            d={act.path}
            style={dashToFraction(totalLength, progress.revealT)}
          />
          <path
            className="overview-map__walked"
            d={act.path}
            style={dashToFraction(totalLength, progress.completeT)}
          />
        </>
      )}
    </svg>
  )
}

/**
 * The zoomed-out screen: every act of the track, in order, each drawn as a
 * miniature of its own path and painted with its own progress, so the whole
 * road is legible at once (`CONTEXT.md` section 9).
 *
 * **A stack of rows, not a grid of tiles.** Section 8 bans bento grids outright,
 * and the acts are a sequence — a single hairline-ruled column in index order is
 * both the editorial form and the truthful one.
 *
 * **No connector drawn between the miniatures.** The curves start and end at
 * different corners (`long` ends at x=130, `medium` at x=1070), so a line joining
 * two rows would be decoration pretending to be geometry. What chains the acts is
 * the stack order and the progress painted continuously across it: finished acts
 * read as quiet ember, the act the learner is standing in is half painted, the
 * rest are plain rule.
 *
 * Row order is `track.acts` order and nothing else — the same order the pager
 * walks and the same indices the nav strip counts.
 */
export function Overview({
  track,
  progress,
  standingActId,
  onSelectAct,
}: OverviewProps): ReactNode {
  return (
    <Section
      // Front matter, not an act: the acts are 01..n and this is the page
      // before them.
      index="00"
      kicker={track.title}
      title="The whole road"
      standfirst={`Every act on the way to ${track.destination.toLowerCase()}.`}
    >
      {track.acts.length === 0 ? (
        <p className="overview__empty">This track has no acts yet.</p>
      ) : (
        <ol className="overview">
          {track.acts.map((act, index) => {
            const actProgress = progress.acts.get(act.id) ?? EMPTY_ACT_PROGRESS
            const here = act.id === standingActId
            return (
              <li key={act.id} className="overview__item">
                <button
                  type="button"
                  className="overview__act"
                  data-here={here ? 'true' : undefined}
                  onClick={() => onSelectAct(act.id)}
                >
                  <span className="overview__text">
                    <span className="overview__kicker">
                      <span className="overview__index">{padIndex(index + 1)}</span>
                      {/* Said in words, not only in the accent marker: colour is
                          never the only carrier of a state (section 8 spends the
                          accent on "here", and this is what it means). */}
                      {here ? <span className="overview__here">You are here</span> : null}
                    </span>
                    <span className="overview__title">{act.title}</span>
                    <span className="overview__subtitle">{act.subtitle}</span>
                    <span className="overview__tally">
                      {actProgress.done} / {actProgress.total} done
                      {actProgress.frontier.total > 0
                        ? ` · ${actProgress.frontier.done} / ${actProgress.frontier.total} frontier`
                        : null}
                    </span>
                  </span>
                  <span className="overview__mini">
                    <ActMini act={act} progress={actProgress} />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </Section>
  )
}
