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

/** Categorías ya validadas hoy (una fila por objetivo). */
async function listValidatedCategoriesToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string,
): Promise<{ categories: string[]; source: string }> {
  const { data, error } = await supabase
    .from('daily_validations')
    .select('category')
    .eq('user_id', userId)
    .eq('validation_date', date)

  if (!error) {
    const categories = (data ?? [])
      .map((r) => (typeof r.category === 'string' ? r.category.trim() : ''))
      .filter(Boolean)
    return { categories, source: 'daily_validations' }
  }

  console.warn('[api/daily-validation] list fallback', error.message)
  return { categories: [], source: 'error' }
}

/** GET ?date=YYYY-MM-DD&categoryId=opcional → estado por objetivo o lista del día. */
export async function GET(request: Request) {
  try {
    const { supabase, userId } = await getAuthedUserId()
    if (!userId) {
      return json({ completedToday: false, categories: [], error: 'unauthenticated' }, 401)
    }

    const url = new URL(request.url)
    const rawDate = url.searchParams.get('date')?.trim() ?? ''
    const date = isValidDateKey(rawDate) ? rawDate : localTodayKey()
    const categoryId = url.searchParams.get('categoryId')?.trim() || null

    const { categories, source } = await listValidatedCategoriesToday(supabase, userId, date)
    const completedForCategory = categoryId ? categories.includes(categoryId) : false

    return json({
      // Compat: completedToday = ese objetivo (si se pide) o si hay alguno.
      completedToday: categoryId ? completedForCategory : categories.length > 0,
      categoryCompleted: completedForCategory,
      categories,
      date,
      categoryId,
      source,
      message: completedForCategory ? DAILY_VALIDATION_BLOCKED_MESSAGE : null,
    })
  } catch (err) {
    console.error('[api/daily-validation GET]', err)
    return json({ completedToday: false, categories: [], error: 'server_error' }, 500)
  }
}

/** POST { date?, categoryId } → registra validación de UN objetivo (idempotente). */
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

    if (!categoryId) {
      return json({ ok: false, error: 'missing_category', message: 'Falta categoryId' }, 400)
    }

    const { categories } = await listValidatedCategoriesToday(supabase, userId, date)
    if (categories.includes(categoryId)) {
      return json({
        ok: false,
        alreadyExists: true,
        completedToday: true,
        categoryCompleted: true,
        date,
        categoryId,
        categories,
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
          categoryCompleted: true,
          date,
          categoryId,
          message: DAILY_VALIDATION_BLOCKED_MESSAGE,
        })
      }

      console.error('[api/daily-validation POST]', error)
      return json({
        ok: false,
        completedToday: false,
        date,
        categoryId,
        error: error.message,
        skipped: true,
      })
    }

    return json({
      ok: true,
      completedToday: true,
      categoryCompleted: true,
      date,
      categoryId,
      categories: [...categories, categoryId],
    })
  } catch (err) {
    console.error('[api/daily-validation POST]', err)
    return json({ ok: false, error: 'server_error' }, 500)
  }
}
