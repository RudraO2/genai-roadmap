/**
 * Is the character moving right now? `true` from the moment `t` changes until
 * it has been still for `WALK_SETTLE_MS`.
 *
 * This is what keeps the bob inside `CONTEXT.md` section 8: motion only to show
 * state change. A walk cycle that ran on a stationary figure would be ambient
 * animation. It is also what `prompts/00-antigravity-assets.md` asks of the
 * sprite version — "pause the animation when `t` is not changing" — so the
 * gate survives the sheet swap unchanged.
 */

import { useEffect, useRef, useState } from 'react'

/** How long after the last `t` change the figure keeps walking, in ms. */
export const WALK_SETTLE_MS = 400

export function useWalking(t: number): boolean {
  const previousT = useRef(t)
  const [walking, setWalking] = useState(false)

  useEffect(() => {
    // Mount, or a re-render for an unrelated reason: no movement, no timer.
    if (previousT.current === t) return
    previousT.current = t

    setWalking(true)
    const timer = window.setTimeout(() => setWalking(false), WALK_SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [t])

  return walking
}
