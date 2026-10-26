import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { accentFromCategory, profileToCommunityUser } from '@/lib/supabase/mappers'
import type { CommunityPost } from '@/lib/community-data'
import type { PostRow } from '@/lib/supabase/database.types'

export const runtime = 'nodejs'
export const maxDuration = 60

const POSTS_BUCKET = 'posts'
const POST_COLUMNS =
  'id, user_id, habit_id, image_url, caption, visibility, created_at' as const
const POST_COLUMNS_LEGACY =
  'id, user_id, habit_id, image_url, caption, created_at' as const

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function normalizeVisibility(raw: string): 'global' | 'network' {
  if (raw === 'network' || raw === 'private') return 'network'
  return 'global'
}

function friendlyNetwork(msg: string) {
  if (/failed to fetch|networkerror|fetch failed|econnrefused|enotfound/i.test(msg)) {
    return 'No se pudo conectar con Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL, el bucket «posts» (público) y las políticas de Storage/RLS.'
  }
  if (/row-level security|rls policy/i.test(msg)) {
    return 'RLS bloqueó la publicación. En Supabase → SQL Editor ejecuta el archivo supabase/fix-rls-publish.sql (INSERT en posts exige auth.uid() = user_id).'
  }
  return msg
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return json(
        { ok: false, message: 'Debes iniciar sesión para publicar en el feed.' },
        401,
      )
    }
    const userId = authData.user.id

    const form = await request.formData()
    const image = form.get('image')
    const caption = String(form.get('caption') ?? '').trim()
    const visibility = normalizeVisibility(String(form.get('visibility') ?? 'global'))
    const habitTitle = String(form.get('habitTitle') ?? '').trim() || 'Hábito'
    const categoryKey = String(form.get('categoryKey') ?? '').trim() || null
    const displayName =
      String(form.get('displayName') ?? '').trim() ||
      (typeof authData.user.user_metadata?.full_name === 'string'
        ? authData.user.user_metadata.full_name
        : 'Usuario FotoHabit')
    const streakDays = Number(form.get('streakDays') ?? 0) || 0
    const level = Number(form.get('level') ?? 1) || 1

    if (!(image instanceof File) || image.size === 0) {
      return json({ ok: false, message: 'Falta la imagen para publicar.' }, 400)
    }
    if (!image.type.startsWith('image/') && image.type !== '') {
      return json({ ok: false, message: 'El archivo debe ser una imagen.' }, 400)
    }
    if (image.size > 8 * 1024 * 1024) {
      return json({ ok: false, message: 'La imagen supera 8 MB.' }, 400)
    }

    // Perfil mínimo (solo columnas reales).
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingProfile?.id) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        username: displayName.slice(0, 40),
        level: 1,
      })
      if (
        profileError &&
        profileError.code !== '23505' &&
        !profileError.message.toLowerCase().includes('duplicate')
      ) {
        console.error('[publish-post] profile', profileError)
        return json(
          {
            ok: false,
            message: friendlyNetwork(
              profileError.message || 'No se pudo preparar el perfil',
            ),
          },
          500,
        )
      }
    }

    // Hábito (tabla habits).
    let habitId: string | null = null
    if (categoryKey) {
      const { data: existingHabit } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .eq('category', categoryKey)
        .maybeSingle()

      if (existingHabit?.id) {
        habitId = existingHabit.id
        await supabase
          .from('habits')
          .update({ title: habitTitle, streak_days: streakDays })
          .eq('id', habitId)
      }
    }

    if (!habitId) {
      const { data: created, error: habitError } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          title: habitTitle,
          category: categoryKey,
          streak_days: streakDays,
        })
        .select('id')
        .single()

      if (habitError || !created) {
        console.error('[publish-post] habit', habitError)
        return json(
          {
            ok: false,
            message: friendlyNetwork(
              habitError?.message || 'No se pudo crear el hábito en Supabase',
            ),
          },
          500,
        )
      }
      habitId = created.id as string
    }

    // Storage bucket «posts».
    const bytes = Buffer.from(await image.arrayBuffer())
    const ext = image.type.includes('png')
      ? 'png'
      : image.type.includes('webp')
        ? 'webp'
        : 'jpg'
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage.from(POSTS_BUCKET).upload(path, bytes, {
      contentType: image.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      console.error('[publish-post] storage', uploadError)
      return json(
        {
          ok: false,
          message: friendlyNetwork(
            uploadError.message.includes('Bucket') ||
              uploadError.message.toLowerCase().includes('not found')
              ? 'El bucket «posts» no existe o no es público. Créalo en Supabase Storage y permite subidas autenticadas.'
              : `No se pudo subir la imagen: ${uploadError.message}`,
          ),
        },
        500,
      )
    }

    const { data: publicData } = supabase.storage.from(POSTS_BUCKET).getPublicUrl(path)
    const imageUrl = publicData?.publicUrl
    if (!imageUrl) {
      return json({ ok: false, message: 'No se obtuvo la URL pública de la imagen.' }, 500)
    }

    // Insert: user_id = auth.uid() (obligatorio para RLS posts_insert_own).
    let { data: postRow, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        habit_id: habitId,
        image_url: imageUrl,
        caption: caption || null,
        visibility,
      })
      .select(POST_COLUMNS)
      .single()

    if (
      postError &&
      /visibility|schema cache|column/i.test(postError.message)
    ) {
      const legacy = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          habit_id: habitId,
          image_url: imageUrl,
          caption: caption || null,
        })
        .select(POST_COLUMNS_LEGACY)
        .single()
      postRow = legacy.data
        ? ({ ...legacy.data, visibility } as PostRow)
        : null
      postError = legacy.error
    }

    if (postError || !postRow) {
      console.error('[publish-post] insert', {
        postError,
        userId,
        authUid: userId,
      })
      return json(
        {
          ok: false,
          message: friendlyNetwork(
            postError?.message || 'No se pudo insertar en la tabla posts',
          ),
        },
        500,
      )
    }

    const row = {
      ...(postRow as PostRow),
      visibility: normalizeVisibility(
        (postRow as PostRow).visibility ?? visibility,
      ),
    }
    const accent = accentFromCategory(categoryKey)
    const author = profileToCommunityUser(
      {
        id: userId,
        username: displayName,
        avatar_url: null,
        level,
        created_at: row.created_at,
      },
      { streak: streakDays, primaryHabit: habitTitle, accent, isSelf: true },
    )

    const post: CommunityPost = {
      id: row.id,
      userId: row.user_id,
      habit: habitTitle,
      accent,
      caption: row.caption ?? '',
      time: 'ahora',
      likes: 0,
      visibility: row.visibility,
      level,
      streakDays,
      imageUrl: row.image_url,
      previewUrl: null,
      neonFire: false,
      comments: [],
      author,
    }

    return json({ ok: true, post })
  } catch (err) {
    console.error('[publish-post]', err)
    const message =
      err instanceof Error
        ? friendlyNetwork(err.message)
        : 'Error inesperado al publicar en el feed'
    return json({ ok: false, message }, 500)
  }
}
