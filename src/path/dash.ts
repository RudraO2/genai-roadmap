/**
 * The dash pattern that draws the first `fraction` of a path and nothing else.
 *
 * `stroke-dasharray: L` lays out a dash of L followed by a gap of L; a
 * `stroke-dashoffset` of `L * (1 - fraction)` slides that pattern back so the
 * visible dash covers exactly `[0, L * fraction]`. This is `CONTEXT.md` section
 * 9's fog of war, it is also what clips the completed stroke, and spec 10's
 * overview miniatures clip with it too.
 *
 * It lived inline in `ActPath` until a second path needed it, exactly as the
 * measurement did before `usePathLength`. One clip, one implementation: three
 * drawings of the same act must not be able to disagree about how far along it
 * the learner is.
 *
 * Takes a length rather than reading one, so it stays a pure function of two
 * numbers and needs neither React nor the DOM.
 */

export interface DashClip {
  strokeDasharray: number
  strokeDashoffset: number
}

export function dashToFraction(totalLength: number, fraction: number): DashClip {
  return {
    strokeDasharray: totalLength,
    strokeDashoffset: totalLength * (1 - fraction),
  }
}
