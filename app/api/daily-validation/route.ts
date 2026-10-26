import { NextResponse } from 'next/server'
import {
  DAILY_VALIDATION_BLOCKED_MESSAGE,
  isValidDateKey,
  localTodayKey,
} from '@/lib/daily-validation'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function getAuthedUserId() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { supabase, userId: null as string | null }
  return { supabase, userId: data.user.id }
}

async function hasValidationToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string,
): Promise<{ completed: boolean; categoryId: string | null; source: string }> {
  const { data, error } = await supabase
    .from('daily_validations')
    .select('category')
    .eq('user_id', userId)
    .eq('validation_date', date)
    .maybeSingle()

  if (!error) {
    return {
      completed: Boolean(data),
      categoryId: typeof data?.category === 'string' ? data.category : null,
      source: 'daily_validations',
    }
  }

  // Fallback posts del día si la tabla aún no existe.
  console.warn('[api/daily-validation] table check fallback', error.message)
  const start = `${date}T00:00:00.000Z`
  const endDate = new Date(`${date}T00:00:00.000Z`)
  endDate.setUTCDate(endDate.getUTCDate() + 1)

  const { data: posts } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', endDate.toISOString())
    .limit(1)

  return {
    completed: (posts?.length ?? 0) > 0,
    categoryId: null,
    source: 'posts',
  }
}

/** GET ?date=YYYY-MM-DD → { completedToday, message? } */
export async function GET(request: Request) {
  try {
    const { supabase, userId } = await getAuthedUserId()
    if (!userId) {
      return json({ completedToday: false, error: 'unauthenticated' }, 401)
    }

    const url = new URL(request.url)
    const rawDate = url.searchParams.get('date')?.trim() ?? ''
    const date = isValidDateKey(rawDate) ? rawDate : localTodayKey()

    const status = await hasValidationToday(supabase, userId, date)

    return json({
      completedToday: status.completed,
      date,
      categoryId: status.categoryId,
      source: status.source,
      message: status.completed ? DAILY_VALIDATION_BLOCKED_MESSAGE : null,
    })
  } catch (err) {
    console.error('[api/daily-validation GET]', err)
    return json({ completedToday: false, error: 'server_error' }, 500)
  }
}

/** POST { date?, categoryId? } → registra o rechaza si ya existe. */
export async function POST(request: Request) {
  try {
    const { supabase, userId } = await getAuthedUserId()
    if (!userId) {
      return json({ ok: false, error: 'unauthenticated' }, 401)
    }

    let body: { date?: string; categoryId?: string } = {}
    try {
      body = (await request.json()) as typeof body
    } catch {
      body = {}
    }

    const date =
      typeof body.date === 'string' && isValidDateKey(body.date)
        ? body.date
        : localTodayKey()
    const categoryId =
      typeof body.categoryId === 'string' && body.categoryId.trim()
        ? body.categoryId.trim()
        : null

    const existing = await hasValidationToday(supabase, userId, date)
    if (existing.completed) {
      return json({
        ok: false,
        alreadyExists: true,
        completedToday: true,
        date,
        message: DAILY_VALIDATION_BLOCKED_MESSAGE,
      })
    }

    const { error } = await supabase.from('daily_validations').insert({
      user_id: userId,
      category: categoryId,
      validation_date: date,
    })

    if (error) {
      if (
        error.code === '23505' ||
        error.message.toLowerCase().includes('duplicate') ||
        error.message.toLowerCase().includes('unique')
      ) {
        return json({
          ok: false,
          alreadyExists: true,
          completedToday: true,
          date,
          message: DAILY_VALIDATION_BLOCKED_MESSAGE,
        })
      }

      // Tabla no migrada: no bloquear el progreso local, pero avisar.
      console.error('[api/daily-validation POST]', error)
      return json({
        ok: false,
        completedToday: false,
        date,
        error: error.message,
        skipped: true,
      })
    }

    return json({ ok: true, completedToday: true, date, categoryId })
  } catch (err) {
    console.error('[api/daily-validation POST]', err)
    return json({ ok: false, error: 'server_error' }, 500)
  }
}
