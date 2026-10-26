'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ExploreObjectivesContextValue = {
  isAddGoalOpen: boolean
  openAddGoal: () => void
  closeAddGoal: () => void
  setIsAddGoalOpen: (open: boolean) => void
}

const ExploreObjectivesContext = createContext<ExploreObjectivesContextValue | null>(null)

export function ExploreObjectivesProvider({ children }: { children: ReactNode }) {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)

  const openAddGoal = useCallback(() => setIsAddGoalOpen(true), [])
  const closeAddGoal = useCallback(() => setIsAddGoalOpen(false), [])

  const value = useMemo(
    () => ({
      isAddGoalOpen,
      openAddGoal,
      closeAddGoal,
      setIsAddGoalOpen,
    }),
    [isAddGoalOpen, openAddGoal, closeAddGoal],
  )

  return (
    <ExploreObjectivesContext.Provider value={value}>
      {children}
    </ExploreObjectivesContext.Provider>
  )
}

export function useExploreObjectives() {
  const ctx = useContext(ExploreObjectivesContext)
  if (!ctx) {
    throw new Error('useExploreObjectives must be used within ExploreObjectivesProvider')
  }
  return ctx
}
