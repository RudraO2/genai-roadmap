/**
 * A `t` that walks to its target instead of jumping to it.
 *
 * This is the first thing in the project that changes `t` over time, which is
 * what starts the character's bob — `useWalking` watches `t`, so there is no
 * flag to set (spec 07's note). It stays inside `CONTEXT.md` section 8 because
 * every frame it emits is the tail of a state change the learner just caused:
 * on mount it snaps, and once the target is reached it stops scheduling frames.
 *
 * Speed is constant, not duration: a short hop between two neighbouring nodes
 * takes proportionally less time than a jump across an act, so the figure looks
 * like it is walking rather than teleporting at a fixed cadence.
 */

import { useEffect, useRef, useState } from 'react'

/** Milliseconds to walk a whole path, t = 0 to t = 1. */
export const TWEEN_MS_PER_T = 2400
export const TWEEN_MIN_MS = 180
export const TWEEN_MAX_MS = 1200

/** Below this the two positions are the same point; snap and schedule nothing. */
const T_EPSILON = 0.0005

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

/**
 * @param target Where the walker belongs now.
 * @param resetKey Identity of the path being walked (track and act). A change
 *   means the previous position is on a different curve and cannot be tweened
 *   from, so the walk restarts from that path's start.
 */
export function useTweenedT(target: number, resetKey: string): number {
  const [value, setValue] = useState(target)
  // Read inside the effect without making it a dependency: retargeting mid-walk
  // must continue from where the figure actually is, not restart the effect.
  const valueRef = useRef(target)
  valueRef.current = value

  const [walkedKey, setWalkedKey] = useState(resetKey)
  const mounted = useRef(false)

  // A different path. `t` means nothing across curves, so the walk restarts at
  // the new one's start — and it restarts here, during render, rather than in
  // the effect below. Doing it in the effect left one painted frame with the
  // old act's `t` resolved against the new act's geometry, which put the figure
  // somewhere it had never stood.
  if (walkedKey !== resetKey) {
    setWalkedKey(resetKey)
    setValue(0)
  }

  useEffect(() => {
    // First paint places the figure; it does not walk in from nowhere.
    if (!mounted.current) {
      mounted.current = true
      setValue(target)
      return
    }

    const from = valueRef.current
    const distance = Math.abs(target - from)

    if (distance < T_EPSILON || prefersReducedMotion()) {
      setValue(target)
      return
    }

    const duration = Math.min(TWEEN_MAX_MS, Math.max(TWEEN_MIN_MS, distance * TWEEN_MS_PER_T))
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const elapsed = now - start
      if (elapsed >= duration) {
        setValue(target)
        return
      }
      // Linear: a walker holds one speed. Easing would read as a stumble.
      setValue(from + (target - from) * (elapsed / duration))
      frame = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(frame)
  }, [target, resetKey])

  return value
}
