'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { HabitCategoryId } from '@/lib/habit-challenges'
import { FREE_ACTIVE_OBJECTIVES_LIMIT } from '@/lib/kore-pro'

type ProgressMap = Record<HabitCategoryId, number>
type TodayMap = Partial<Record<HabitCategoryId, boolean>>

const INITIAL_PROGRESS: ProgressMap = {
  'actividad-fisica': 12,
  'orden-limpieza': 8,
  'comida-saludable': 6,
  'enfoque-mente': 5,
  'sueno-descanso': 0,
  'ahorro-finanzas': 0,
  'sin-humos': 0,
}

/** Free: máximo 2 objetivos activos de demostración. */
const INITIAL_ACTIVE: HabitCategoryId[] = ['actividad-fisica', 'comida-saludable']

function isProCategory(id: HabitCategoryId): boolean {
  return id === 'sueno-descanso' || id === 'ahorro-finanzas' || id === 'sin-humos'
}

export type ActivateCategoryResult =
  | { ok: true }
  | { ok: false; reason: 'limit' | 'pro-category' }

type ActivateOptions = {
  /** Usuario Kore PRO: objetivos ilimitados + categorías PRO. */
  isPro?: boolean
}

type HabitProgressContextValue = {
  progress: ProgressMap
  todayValidated: TodayMap
  activeCategoryIds: HabitCategoryId[]
  freeActiveLimit: number
  getCompleted: (id: HabitCategoryId) => number
  isTodayValidated: (id: HabitCategoryId) => boolean
  isActive: (id: HabitCategoryId) => boolean
  canActivateCategory: (id: HabitCategoryId, opts?: ActivateOptions) => ActivateCategoryResult
  /** Añade un objetivo al perfil (Stories). Respeta freemium. */
  activateCategory: (id: HabitCategoryId, opts?: ActivateOptions) => ActivateCategoryResult
  completeDay: (id: HabitCategoryId, opts?: ActivateOptions) => number
}

const HabitProgressContext = createContext<HabitProgressContextValue | null>(null)

export function HabitProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(INITIAL_PROGRESS)
  const [todayValidated, setTodayValidated] = useState<TodayMap>({})
  const [activeCategoryIds, setActiveCategoryIds] =
    useState<HabitCategoryId[]>(INITIAL_ACTIVE)

  const getCompleted = useCallback((id: HabitCategoryId) => progress[id] ?? 0, [progress])

  const isTodayValidated = useCallback(
    (id: HabitCategoryId) => Boolean(todayValidated[id]),
    [todayValidated],
  )

  const isActive = useCallback(
    (id: HabitCategoryId) => activeCategoryIds.includes(id),
    [activeCategoryIds],
  )

  const canActivateCategory = useCallback(
    (id: HabitCategoryId, opts?: ActivateOptions): ActivateCategoryResult => {
      if (activeCategoryIds.includes(id)) return { ok: true }
      const pro = Boolean(opts?.isPro)
      if (isProCategory(id) && !pro) return { ok: false, reason: 'pro-category' }
      if (!pro && activeCategoryIds.length >= FREE_ACTIVE_OBJECTIVES_LIMIT) {
        return { ok: false, reason: 'limit' }
      }
      return { ok: true }
    },
    [activeCategoryIds],
  )

  const activateCategory = useCallback(
    (id: HabitCategoryId, opts?: ActivateOptions): ActivateCategoryResult => {
      const check = canActivateCategory(id, opts)
      if (!check.ok) return check
      setActiveCategoryIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      return { ok: true }
    },
    [canActivateCategory],
  )

  const completeDay = useCallback(
    (id: HabitCategoryId, opts?: ActivateOptions) => {
      let next = 0
      setProgress((prev) => {
        next = (prev[id] ?? 0) + 1
        return { ...prev, [id]: next }
      })
      setTodayValidated((prev) => ({ ...prev, [id]: true }))
      // Solo auto-activa si cabe en el plan (o ya estaba activo)
      setActiveCategoryIds((prev) => {
        if (prev.includes(id)) return prev
        const pro = Boolean(opts?.isPro)
        if (isProCategory(id) && !pro) return prev
        if (!pro && prev.length >= FREE_ACTIVE_OBJECTIVES_LIMIT) return prev
        return [...prev, id]
      })
      return next
    },
    [],
  )

  const value = useMemo(
    () => ({
      progress,
      todayValidated,
      activeCategoryIds,
      freeActiveLimit: FREE_ACTIVE_OBJECTIVES_LIMIT,
      getCompleted,
      isTodayValidated,
      isActive,
      canActivateCategory,
      activateCategory,
      completeDay,
    }),
    [
      progress,
      todayValidated,
      activeCategoryIds,
      getCompleted,
      isTodayValidated,
      isActive,
      canActivateCategory,
      activateCategory,
      completeDay,
    ],
  )

  return (
    <HabitProgressContext.Provider value={value}>{children}</HabitProgressContext.Provider>
  )
}

export function useHabitProgress() {
  const ctx = useContext(HabitProgressContext)
  if (!ctx) {
    throw new Error('useHabitProgress must be used within HabitProgressProvider')
  }
  return ctx
}

export { isProCategory }
