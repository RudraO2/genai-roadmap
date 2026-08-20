/**
 * Was `value` just marked `true`? `true` for one `--dur-reward` cycle from the
 * moment `value` flips `false → true`, then `false` again — never on mount with
 * `value` already `true`, and never on the reverse flip.
 *
 * This is what keeps a reward animation inside `CONTEXT.md` section 8's "motion
 * only to show state change": a node that loads already complete (or one the
 * learner un-marks) gets no animation, only the click that actually finishes it
 * does. Same shape as `useWalking` — a ref holding the last value, a timer that
 * clears the flag once the animation has had time to play.
 */

import { useEffect, useRef, useState } from 'react'

/** Matches `--dur-reward` in theme.css. Duplicated as a number because CSS
 *  custom properties are not readable from a plain `setTimeout`. */
const REWARD_MS = 420

export function useJustCompleted(value: boolean): boolean {
  const previous = useRef(value)
  const [justCompleted, setJustCompleted] = useState(false)

  useEffect(() => {
    const wasComplete = previous.current
    previous.current = value

    if (!wasComplete && value) {
      setJustCompleted(true)
      const timer = window.setTimeout(() => setJustCompleted(false), REWARD_MS)
      return () => window.clearTimeout(timer)
    }

    if (wasComplete && !value) setJustCompleted(false)
    return undefined
  }, [value])

  return justCompleted
}
