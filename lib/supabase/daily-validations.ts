import { createClient } from './client'
import { isValidDateKey, localTodayKey } from '@/lib/daily-validation'

export type DailyValidationStatus = {
  completedToday: boolean
  date: string
  categoryId: string | null
  source: 'daily_validations' | 'posts' | 'none' | 'error'
}

/**
 * Comprueba en Supabase si el usuario ya tiene una validación exitosa hoy.
 * Preferencia: tabla daily_validations; fallback: posts del día.
 */
export async function fetchDailyValidationStatus(
  userId: string,
  date = localTodayKey(),
): Promise<DailyValidationStatus> {
  if (!userId || !isValidDateKey(date)) {
    return { completedToday: false, date, categoryId: null, source: 'none' }
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('daily_validations')
      .select('category, validation_date')
      .eq('user_id', userId)
      .eq('validation_date', date)
      .maybeSingle()

    if (!error) {
      if (data) {
        return {
          completedToday: true,
          date,
          categoryId: typeof data.category === 'string' ? data.category : null,
          source: 'daily_validations',
        }
      }
      return { completedToday: false, date, categoryId: null, source: 'daily_validations' }
    }

    // Tabla ausente / RLS: fallback por posts del día (UTC window aproximada).
    console.warn('[daily_validations] select fallback → posts', error.message)
  } catch (err) {
    console.warn('[daily_validations] select error', err)
  }

  try {
    const start = `${date}T00:00:00.000Z`
    const endDate = new Date(`${date}T00:00:00.000Z`)
    endDate.setUTCDate(endDate.getUTCDate() + 1)
    const end = endDate.toISOString()

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lt('created_at', end)
      .limit(1)

    if (postsError) {
      console.warn('[daily_validations] posts fallback error', postsError.message)
      return { completedToday: false, date, categoryId: null, source: 'error' }
    }

    const hit = (posts?.length ?? 0) > 0
    return {
      completedToday: hit,
      date,
      categoryId: null,
      source: hit ? 'posts' : 'none',
    }
  } catch (err) {
    console.warn('[daily_validations] posts fallback exception', err)
    return { completedToday: false, date, categoryId: null, source: 'error' }
  }
}

/** Registra la validación del día (idempotente por unique user+date). */
export async function recordDailyValidation(input: {
  userId: string
  categoryId?: string | null
  date?: string
}): Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }> {
  const date = input.date && isValidDateKey(input.date) ? input.date : localTodayKey()
  const supabase = createClient()

  try {
    const { error } = await supabase.from('daily_validations').insert({
      user_id: input.userId,
      category: input.categoryId ?? null,
      validation_date: date,
    })

    if (!error) return { ok: true }

    // Ya existía (unique) → día ya completado.
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
