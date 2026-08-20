/**
 * Intake storage: the learner's chosen path and level.
 *
 * `loadIntake` never throws. Private browsing with storage disabled, hand-edited
 * JSON, or a path id this build no longer knows must all degrade to "no intake
 * yet" rather than crash the app.
 */

import { LEVELS } from '../constants.ts'
import { registry } from './roadmap.ts'
import type { Level, PathId } from '../types.ts'

export interface IntakeState {
  path: PathId
  level: Level
}

const INTAKE_KEY = 'roadmap:intake:v2'

function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as readonly string[]).includes(value)
}

/**
 * The one definition of what a valid intake looks like. Storage reads it here and
 * so does an imported progress file, so a path id this build does not know is
 * rejected the same way whichever door it arrives through.
 */
export function parseIntake(value: unknown): IntakeState | null {
  if (typeof value !== 'object' || value === null) return null
  const { path, level } = value as Record<string, unknown>
  if (!registry.isPathId(path) || !isLevel(level)) return null
  return { path, level }
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

  return parseIntake(parsed)
}

export function saveIntake(state: IntakeState): void {
  try {
    localStorage.setItem(INTAKE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable (private browsing, quota). Nothing to recover; the app
    // simply asks again next visit.
  }
}

export function clearIntake(): void {
  try {
    localStorage.removeItem(INTAKE_KEY)
  } catch {
    // Same as above.
  }
}
