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
import { useAuth } from './auth-context'

type ProgressMap = Record<HabitCategoryId, number>
type TodayMap = Partial<Record<HabitCategoryId, boolean>>

const DAILY_STORAGE_KEY = 'fotohabit.dailyValidation.v1'
const PROGRESS_STORAGE_KEY = 'fotohabit.progress.v1'
const ONBOARDING_STORAGE_PREFIX = 'fotohabit.onboarding.v1:'

const ALL_CATEGORY_IDS: HabitCategoryId[] = [
  'actividad-fisica',
  'orden-limpieza',
  'comida-saludable',
  'enfoque-mente',
  'sueno-descanso',
  'ahorro-finanzas',
  'sin-humos',
]

/** Nuevo usuario: sin rachas inventadas. */
const EMPTY_PROGRESS: ProgressMap = {
  'actividad-fisica': 0,
  'orden-limpieza': 0,
  'comida-saludable': 0,
  'enfoque-mente': 0,
  'sueno-descanso': 0,
  'ahorro-finanzas': 0,
  'sin-humos': 0,
}

/** Nuevo usuario: sin objetivos preseleccionados. */
const EMPTY_ACTIVE: HabitCategoryId[] = []

export const DAILY_VALIDATION_BLOCKED_MESSAGE =
  'Ya has completado tu hábito de hoy. Vuelve mañana para seguir sumando a tu racha 🔥'

/** Solo categorías avanzadas requieren PRO. Enfoque, Orden, Actividad y Comida son gratis. */
const PRO_CATEGORY_IDS: ReadonlySet<HabitCategoryId> = new Set([
  'sueno-descanso',
  'ahorro-finanzas',
  'sin-humos',
])

function isProCategory(id: HabitCategoryId): boolean {
  return PRO_CATEGORY_IDS.has(id)
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
  userId?: string
}

type StoredProgressBlob = {
  userId: string
  progress: ProgressMap
  activeCategoryIds: HabitCategoryId[]
}

function sanitizeProgress(raw: unknown): ProgressMap {
  const base = { ...EMPTY_PROGRESS }
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const id of ALL_CATEGORY_IDS) {
    const n = obj[id]
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0) {
      base[id] = Math.floor(n)
    }
  }
  return base
}

function sanitizeActive(raw: unknown): HabitCategoryId[] {
  if (!Array.isArray(raw)) return []
  const allowed = new Set<string>(ALL_CATEGORY_IDS)
  const out: HabitCategoryId[] = []
  for (const item of raw) {
    if (typeof item === 'string' && allowed.has(item) && !out.includes(item as HabitCategoryId)) {
      out.push(item as HabitCategoryId)
    }
  }
  return out
}

function readStoredProgress(userId: string): StoredProgressBlob | null {
  if (typeof window === 'undefined' || !userId) return null
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredProgressBlob
    if (!parsed || parsed.userId !== userId) return null
    return {
      userId,
      progress: sanitizeProgress(parsed.progress),
      activeCategoryIds: sanitizeActive(parsed.activeCategoryIds),
    }
  } catch {
    return null
  }
}

function writeStoredProgress(
  userId: string,
  progress: ProgressMap,
  activeCategoryIds: HabitCategoryId[],
) {
  if (typeof window === 'undefined' || !userId) return
  try {
    const payload: StoredProgressBlob = { userId, progress, activeCategoryIds }
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* private mode */
  }
}

function readStoredDaily(userId: string): StoredDailyValidation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DAILY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDailyValidation
    if (!parsed?.date || !parsed?.categoryId) return null
    if (parsed.userId && parsed.userId !== userId) {
      window.localStorage.removeItem(DAILY_STORAGE_KEY)
      return null
    }
    if (parsed.date !== localTodayKey()) {
      window.localStorage.removeItem(DAILY_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStoredDaily(userId: string, categoryId: HabitCategoryId) {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredDailyValidation = {
      date: localTodayKey(),
      categoryId,
      userId,
    }
    window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* private mode */
  }
}

export function hasCompletedOnboarding(userId: string): boolean {
  if (typeof window === 'undefined' || !userId) return true
  try {
    return window.localStorage.getItem(`${ONBOARDING_STORAGE_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

export function markOnboardingComplete(userId: string) {
  if (typeof window === 'undefined' || !userId) return
  try {
    window.localStorage.setItem(`${ONBOARDING_STORAGE_PREFIX}${userId}`, '1')
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
  hydrated: boolean
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
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [progress, setProgress] = useState<ProgressMap>(EMPTY_PROGRESS)
  const [todayValidated, setTodayValidated] = useState<TodayMap>({})
  const [activeCategoryIds, setActiveCategoryIds] =
    useState<HabitCategoryId[]>(EMPTY_ACTIVE)
  const [hydrated, setHydrated] = useState(false)

  // Cargar progreso del usuario (o vacío si es nuevo / sin datos).
  useEffect(() => {
    if (!userId) {
      setProgress(EMPTY_PROGRESS)
      setActiveCategoryIds(EMPTY_ACTIVE)
      setTodayValidated({})
      setHydrated(false)
      return
    }

    const stored = readStoredProgress(userId)
    setProgress(stored?.progress ?? { ...EMPTY_PROGRESS })
    setActiveCategoryIds(stored?.activeCategoryIds ?? [...EMPTY_ACTIVE])

    const daily = readStoredDaily(userId)
    setTodayValidated(daily ? { [daily.categoryId]: true } : {})
    setHydrated(true)
  }, [userId])

  // Persistir rachas y activos por usuario.
  useEffect(() => {
    if (!userId || !hydrated) return
    writeStoredProgress(userId, progress, activeCategoryIds)
    if (activeCategoryIds.length > 0) {
      markOnboardingComplete(userId)
    }
  }, [userId, hydrated, progress, activeCategoryIds])

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
      if (Object.values(todayValidated).some(Boolean) || (userId && readStoredDaily(userId))) {
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
      if (userId) writeStoredDaily(userId, id)

      setActiveCategoryIds((prev) => {
        if (prev.includes(id)) return prev
        const pro = Boolean(opts?.isPro)
        if (isProCategory(id) && !pro) return prev
        if (!pro && prev.length >= FREE_ACTIVE_OBJECTIVES_LIMIT) return prev
        return [...prev, id]
      })

      return { ok: true, next }
    },
    [todayValidated, userId],
  )

  const value = useMemo(
    () => ({
      progress,
      todayValidated,
      activeCategoryIds,
      freeActiveLimit: FREE_ACTIVE_OBJECTIVES_LIMIT,
      hydrated,
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
      hydrated,
      hasCompletedDailyHabit,
      getCompleted,
      isTodayValidated,
      isActive,
      canValidateToday,
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
