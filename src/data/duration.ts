/**
 * Quest estimates, as arithmetic.
 *
 * Every quest carries an `est` like `90m`, `3h`, `1d` or `2w`. Until now that was
 * a string the interface printed and nothing more, which meant the one question a
 * learner asks before starting a path — *how long is this going to take me?* —
 * had no answer anywhere in an app built entirely out of the data to answer it.
 *
 * The grammar is deliberately tiny and the validator enforces it, so this is not
 * "parsing a display string": `est` is a duration with a compact spelling, and a
 * value that does not match is a build error rather than a silently wrong total.
 *
 *   <n>m   minutes
 *   <n>h   hours
 *   <n>d   a day of work on it
 *   <n>w   a week of it alongside everything else you do
 *   ongoing   a habit, not a task. Contributes nothing to a total, because a
 *             habit does not finish and must not inflate a remaining figure.
 *
 * `d` and `w` are the two that need a number attached to them, and the numbers
 * are chosen for someone learning around a job rather than full time. They are
 * assumptions, they are stated here in one place, and every figure derived from
 * them is printed with a "≈" in front of it.
 */

/** Study hours in a day of work on something. */
const HOURS_PER_DAY = 6

/** Study hours in a week of it, alongside a job. */
const HOURS_PER_WEEK = 20

const UNIT_HOURS: Readonly<Record<string, number>> = {
  m: 1 / 60,
  h: 1,
  d: HOURS_PER_DAY,
  w: HOURS_PER_WEEK,
}

/** A habit rather than a task. Valid, and worth zero hours. */
export const ONGOING = 'ongoing'

const PATTERN = /^(\d+)([mhdw])$/

/** True for anything `est` is allowed to be. The validator's whole rule. */
export function isEstimate(value: unknown): value is string {
  return typeof value === 'string' && (value === ONGOING || PATTERN.test(value))
}

/** Hours of study, or 0 for `ongoing` and for anything that does not parse. */
export function estimateHours(est: string): number {
  if (est === ONGOING) return 0
  const match = PATTERN.exec(est)
  if (!match) return 0
  const [, amount, unit] = match
  return Number(amount) * (UNIT_HOURS[unit!] ?? 0)
}

/**
 * Hours as something a person would say. Coarse on purpose — these are summed
 * guesses, and "≈ 4 weeks" is honest in a way that "163 hours" is not.
 *
 * Each unit hands over at exactly the point the next one becomes worth a whole 1
 * of itself, which is what makes "1 day" and "1 week" reachable. An earlier
 * version switched at twice each threshold and could never print either
 * singular — the plural guards below were dead code, and a test written against
 * them is what found it.
 */
export function formatHours(hours: number): string {
  if (hours <= 0) return 'nothing timed'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < HOURS_PER_DAY) return `${Math.round(hours)}h`
  if (hours < HOURS_PER_WEEK) {
    const days = Math.round(hours / HOURS_PER_DAY)
    return `${days} day${days === 1 ? '' : 's'}`
  }
  const weeks = Math.round(hours / HOURS_PER_WEEK)
  return `${weeks} week${weeks === 1 ? '' : 's'}`
}
