/**
 * Intake storage: the learner's chosen track and level. The only localStorage
 * write in the app so far. `loadIntake` never throws — private browsing with
 * storage disabled, hand-edited JSON, or a stale/unknown id must degrade to
 * "no intake yet", not crash the app.
 */

import { LEVELS, TRACK_IDS } from '../constants.ts'
import type { Level, TrackId } from '../types.ts'

export interface IntakeState {
  track: TrackId
  level: Level
}

const INTAKE_KEY = 'roadmap:intake:v1'

function isTrackId(value: unknown): value is TrackId {
  return typeof value === 'string' && (TRACK_IDS as readonly string[]).includes(value)
}

function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as readonly string[]).includes(value)
}

export function loadIntake(): IntakeState | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(INTAKE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const { track, level } = parsed as Record<string, unknown>
  if (!isTrackId(track) || !isLevel(level)) return null

  return { track, level }
}

export function saveIntake(state: IntakeState): void {
  try {
    localStorage.setItem(INTAKE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable (e.g. private browsing quota). Nothing to recover;
    // the app just re-asks next visit.
  }
}

export function clearIntake(): void {
  try {
    localStorage.removeItem(INTAKE_KEY)
  } catch {
    // Same as above.
  }
}
