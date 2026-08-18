import { useCallback, useState } from 'react'

import { clearIntake, loadIntake, saveIntake, type IntakeState } from '../data/intake.ts'

export interface UseIntake {
  intake: IntakeState | null
  setIntake: (state: IntakeState) => void
  resetIntake: () => void
}

/** Wraps `data/intake.ts` in React state so a write re-renders without a reload. */
export function useIntake(): UseIntake {
  const [intake, setIntakeState] = useState<IntakeState | null>(() => loadIntake())

  const setIntake = useCallback((state: IntakeState) => {
    saveIntake(state)
    setIntakeState(state)
  }, [])

  const resetIntake = useCallback(() => {
    clearIntake()
    setIntakeState(null)
  }, [])

  return { intake, setIntake, resetIntake }
}
