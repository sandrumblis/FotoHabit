'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { HabitCategoryId } from '@/lib/habit-challenges'
import { FREE_ACTIVE_OBJECTIVES_LIMIT } from '@/lib/kore-pro'

type ProgressMap = Record<HabitCategoryId, number>
type TodayMap = Partial<Record<HabitCategoryId, boolean>>

const STORAGE_KEY = 'fotohabit.dailyValidation.v1'

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

export const DAILY_VALIDATION_BLOCKED_MESSAGE =
  'Ya has completado tu hábito de hoy. Vuelve mañana para seguir sumando a tu racha 🔥'

function isProCategory(id: HabitCategoryId): boolean {
  return id === 'sueno-descanso' || id === 'ahorro-finanzas' || id === 'sin-humos'
}

function localTodayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type StoredDailyValidation = {
  date: string
  categoryId: HabitCategoryId
}

function readStoredDaily(): StoredDailyValidation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDailyValidation
    if (!parsed?.date || !parsed?.categoryId) return null
    if (parsed.date !== localTodayKey()) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStoredDaily(categoryId: HabitCategoryId) {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredDailyValidation = {
      date: localTodayKey(),
      categoryId,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* private mode */
  }
}

export type ActivateCategoryResult =
  | { ok: true }
  | { ok: false; reason: 'limit' | 'pro-category' }

export type CompleteDayResult =
  | { ok: true; next: number }
  | { ok: false; reason: 'already-today'; message: string }

type ActivateOptions = {
  /** Usuario FotoHabit PRO: objetivos ilimitados + categorías PRO. */
  isPro?: boolean
}

type HabitProgressContextValue = {
  progress: ProgressMap
  todayValidated: TodayMap
  activeCategoryIds: HabitCategoryId[]
  freeActiveLimit: number
  /** true si ya hay una validación exitosa en el día local actual */
  hasCompletedDailyHabit: boolean
  dailyValidationMessage: string
  getCompleted: (id: HabitCategoryId) => number
  isTodayValidated: (id: HabitCategoryId) => boolean
  isActive: (id: HabitCategoryId) => boolean
  canValidateToday: () => boolean
  canActivateCategory: (id: HabitCategoryId, opts?: ActivateOptions) => ActivateCategoryResult
  /** Añade un objetivo al perfil (Stories). Respeta freemium. */
  activateCategory: (id: HabitCategoryId, opts?: ActivateOptions) => ActivateCategoryResult
  completeDay: (id: HabitCategoryId, opts?: ActivateOptions) => CompleteDayResult
}

const HabitProgressContext = createContext<HabitProgressContextValue | null>(null)

export function HabitProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(INITIAL_PROGRESS)
  const [todayValidated, setTodayValidated] = useState<TodayMap>({})
  const [activeCategoryIds, setActiveCategoryIds] =
    useState<HabitCategoryId[]>(INITIAL_ACTIVE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredDaily()
    if (stored) {
      setTodayValidated({ [stored.categoryId]: true })
    }
    setHydrated(true)
  }, [])

  const hasCompletedDailyHabit = useMemo(
    () => Object.values(todayValidated).some(Boolean),
    [todayValidated],
  )

  const getCompleted = useCallback((id: HabitCategoryId) => progress[id] ?? 0, [progress])

  const isTodayValidated = useCallback(
    (id: HabitCategoryId) => Boolean(todayValidated[id]),
    [todayValidated],
  )

  const isActive = useCallback(
    (id: HabitCategoryId) => activeCategoryIds.includes(id),
    [activeCategoryIds],
  )

  const canValidateToday = useCallback(() => !hasCompletedDailyHabit, [hasCompletedDailyHabit])

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
    (id: HabitCategoryId, opts?: ActivateOptions): CompleteDayResult => {
      // Una sola validación exitosa por día (cualquier objetivo).
      if (Object.values(todayValidated).some(Boolean) || readStoredDaily()) {
        return {
          ok: false,
          reason: 'already-today',
          message: DAILY_VALIDATION_BLOCKED_MESSAGE,
        }
      }

      let next = 0
      setProgress((prev) => {
        next = (prev[id] ?? 0) + 1
        return { ...prev, [id]: next }
      })
      setTodayValidated({ [id]: true })
      writeStoredDaily(id)

      setActiveCategoryIds((prev) => {
        if (prev.includes(id)) return prev
        const pro = Boolean(opts?.isPro)
        if (isProCategory(id) && !pro) return prev
        if (!pro && prev.length >= FREE_ACTIVE_OBJECTIVES_LIMIT) return prev
        return [...prev, id]
      })

      return { ok: true, next }
    },
    [todayValidated],
  )

  const value = useMemo(
    () => ({
      progress,
      todayValidated,
      activeCategoryIds,
      freeActiveLimit: FREE_ACTIVE_OBJECTIVES_LIMIT,
      hasCompletedDailyHabit,
      dailyValidationMessage: DAILY_VALIDATION_BLOCKED_MESSAGE,
      getCompleted,
      isTodayValidated,
      isActive,
      canValidateToday,
      canActivateCategory,
      activateCategory,
      completeDay,
    }),
    [
      progress,
      todayValidated,
      activeCategoryIds,
      hasCompletedDailyHabit,
      getCompleted,
      isTodayValidated,
      isActive,
      canValidateToday,
      canActivateCategory,
      activateCategory,
      completeDay,
      hydrated,
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
