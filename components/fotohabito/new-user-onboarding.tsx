'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './auth-context'
import { useExploreObjectives } from './explore-objectives-context'
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
  useHabitProgress,
} from './habit-progress-context'

/**
 * Invita al usuario nuevo a elegir objetivos la primera vez que entra
 * (sin hábitos activos y sin onboarding previo).
 */
export function NewUserOnboarding() {
  const { user } = useAuth()
  const { activeCategoryIds, hydrated } = useHabitProgress()
  const { openAddGoal, isAddGoalOpen } = useExploreObjectives()
  const openedRef = useRef(false)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (!user?.id || !hydrated) return

    if (activeCategoryIds.length > 0) {
      markOnboardingComplete(user.id)
      return
    }

    if (hasCompletedOnboarding(user.id) || openedRef.current) return

    openedRef.current = true
    const timer = window.setTimeout(() => {
      openAddGoal()
    }, 450)

    return () => window.clearTimeout(timer)
  }, [user?.id, hydrated, activeCategoryIds.length, openAddGoal])

  // Al cerrar el modal de onboarding, marcar como visto (no reabrir en cada visita).
  useEffect(() => {
    if (!user?.id) return
    if (isAddGoalOpen) {
      wasOpenRef.current = true
      return
    }
    if (wasOpenRef.current) {
      markOnboardingComplete(user.id)
      wasOpenRef.current = false
    }
  }, [isAddGoalOpen, user?.id])

  return null
}
