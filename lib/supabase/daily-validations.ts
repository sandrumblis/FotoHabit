import { createClient } from './client'
import { isValidDateKey, localTodayKey } from '@/lib/daily-validation'

export type DailyValidationStatus = {
  /** true si ese categoryId concreto ya se validó hoy (o si hay alguno y no se pasó id). */
  completedToday: boolean
  date: string
  categoryId: string | null
  categories: string[]
  source: 'daily_validations' | 'none' | 'error'
}

/**
 * Lista / comprueba validaciones del día por objetivo.
 */
export async function fetchDailyValidationStatus(
  userId: string,
  date = localTodayKey(),
  categoryId?: string | null,
): Promise<DailyValidationStatus> {
  if (!userId || !isValidDateKey(date)) {
    return { completedToday: false, date, categoryId: null, categories: [], source: 'none' }
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('daily_validations')
      .select('category')
      .eq('user_id', userId)
      .eq('validation_date', date)

    if (error) {
      console.warn('[daily_validations] select', error.message)
      return { completedToday: false, date, categoryId: categoryId ?? null, categories: [], source: 'error' }
    }

    const categories = (data ?? [])
      .map((r) => (typeof r.category === 'string' ? r.category.trim() : ''))
      .filter(Boolean)

    const completedToday = categoryId
      ? categories.includes(categoryId)
      : categories.length > 0

    return {
      completedToday,
      date,
      categoryId: categoryId ?? null,
      categories,
      source: 'daily_validations',
    }
  } catch (err) {
    console.warn('[daily_validations] select error', err)
    return {
      completedToday: false,
      date,
      categoryId: categoryId ?? null,
      categories: [],
      source: 'error',
    }
  }
}

/** Registra validación de un objetivo (unique user+date+category). */
export async function recordDailyValidation(input: {
  userId: string
  categoryId: string
  date?: string
}): Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }> {
  const date = input.date && isValidDateKey(input.date) ? input.date : localTodayKey()
  const category = input.categoryId?.trim()
  if (!category) return { ok: false, error: 'missing_category' }

  const supabase = createClient()

  try {
    const { error } = await supabase.from('daily_validations').insert({
      user_id: input.userId,
      category,
      validation_date: date,
    })

    if (!error) return { ok: true }

    if (
      error.code === '23505' ||
      error.message.toLowerCase().includes('duplicate') ||
      error.message.toLowerCase().includes('unique')
    ) {
      return { ok: true, alreadyExists: true }
    }

    console.error('[daily_validations] insert', error)
    return { ok: false, error: error.message }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al registrar validación'
    console.error('[daily_validations] insert exception', err)
    return { ok: false, error: message }
  }
}
