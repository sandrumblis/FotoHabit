import type { HabitAccent } from '@/lib/community-data'
import { createClient } from './client'
import type { HabitRow, PostRow, PostWithRelations, ProfileRow } from './database.types'
import { mapPostRow } from './mappers'

const POSTS_BUCKET = 'posts'

/** Columnas reales de profiles (NO display_name ni accent). */
const PROFILE_COLUMNS = 'id, username, avatar_url, level, created_at' as const
/** Columnas reales de habits (category, no accent / category_key). */
const HABIT_COLUMNS = 'id, user_id, title, category, streak_days, created_at' as const
const POST_COLUMNS = 'id, user_id, habit_id, image_url, caption, created_at' as const

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(header ?? '')?.[1] ?? 'image/jpeg'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/**
 * Une posts + profiles + habits en el cliente.
 * Evita embeds PostgREST (`profiles_1.display_name`) que fallan con el esquema real.
 */
async function hydratePosts(posts: PostRow[]): Promise<PostWithRelations[]> {
  if (posts.length === 0) return []

  const supabase = createClient()
  const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))]
  const habitIds = [
    ...new Set(posts.map((p) => p.habit_id).filter((id): id is string => Boolean(id))),
  ]

  const [profilesRes, habitsRes] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select(PROFILE_COLUMNS).in('id', userIds)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    habitIds.length
      ? supabase.from('habits').select(HABIT_COLUMNS).in('id', habitIds)
      : Promise.resolve({ data: [] as HabitRow[], error: null }),
  ])

  if (profilesRes.error) throw new Error(profilesRes.error.message)
  if (habitsRes.error) throw new Error(habitsRes.error.message)

  const profilesById = new Map(
    ((profilesRes.data as ProfileRow[] | null) ?? []).map((p) => [p.id, p]),
  )
  const habitsById = new Map(
    ((habitsRes.data as HabitRow[] | null) ?? []).map((h) => [h.id, h]),
  )

  return posts.map((post) => ({
    ...post,
    profiles: profilesById.get(post.user_id) ?? null,
    habits: post.habit_id ? (habitsById.get(post.habit_id) ?? null) : null,
  }))
}

export async function ensureProfile(input: {
  id: string
  displayName: string
  level?: number
}) {
  const supabase = createClient()
  // Solo columnas reales de profiles (NO accent / display_name / bio).
  const row: { id: string; username: string; level?: number } = {
    id: input.id,
    username: input.displayName.trim().slice(0, 40) || 'Usuario FotoHabit',
  }
  if (typeof input.level === 'number' && Number.isFinite(input.level)) {
    row.level = Math.max(1, Math.round(input.level))
  }

  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' })
  if (error) {
    // Si `level` no estuviera en cache, reintentar solo con id+username.
    if (error.message.toLowerCase().includes('level') || error.message.toLowerCase().includes('accent')) {
      const { error: retryError } = await supabase
        .from('profiles')
        .upsert({ id: row.id, username: row.username }, { onConflict: 'id' })
      if (retryError) throw new Error(retryError.message)
      return
    }
    throw new Error(error.message)
  }
}

export async function ensureHabit(input: {
  userId: string
  title: string
  categoryKey?: string
  streakDays?: number
}) {
  const supabase = createClient()

  if (input.categoryKey) {
    const { data: existing } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', input.userId)
      .eq('category', input.categoryKey)
      .maybeSingle()

    if (existing?.id) {
      await supabase
        .from('habits')
        .update({
          title: input.title,
          streak_days: input.streakDays ?? 0,
        })
        .eq('id', existing.id)
      return existing.id as string
    }
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: input.userId,
      title: input.title,
      category: input.categoryKey ?? null,
      streak_days: input.streakDays ?? 0,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear el hábito')
  return data.id as string
}

export async function uploadPostImage(userId: string, image: string | Blob) {
  const supabase = createClient()
  const blob =
    typeof image === 'string'
      ? image.startsWith('data:')
        ? dataUrlToBlob(image)
        : await (await fetch(image)).blob()
      : image

  const ext = blob.type.includes('png') ? 'png' : 'jpg'
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage.from(POSTS_BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type || 'image/jpeg',
  })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from(POSTS_BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('No se pudo obtener la URL pública de la imagen')
  return data.publicUrl
}

export async function createPostRecord(input: {
  userId: string
  habitId: string
  imageUrl: string
  caption: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: input.userId,
      habit_id: input.habitId,
      image_url: input.imageUrl,
      caption: input.caption,
    })
    .select(POST_COLUMNS)
    .single()

  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la publicación')

  const [hydrated] = await hydratePosts([data as PostRow])
  return mapPostRow(hydrated)
}

export async function fetchCommunityFeed() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(POST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) throw new Error(error.message)

  const hydrated = await hydratePosts((data as PostRow[] | null) ?? [])
  return hydrated.map(mapPostRow).filter((p): p is NonNullable<typeof p> => Boolean(p))
}

export async function publishValidatedPhoto(input: {
  userId: string
  displayName: string
  habitTitle: string
  categoryKey?: string
  /** Solo UI local; nunca se escribe en profiles (la tabla no tiene accent). */
  accent?: HabitAccent
  caption: string
  streakDays: number
  level: number
  image: string | Blob
}) {
  void input.accent

  await ensureProfile({
    id: input.userId,
    displayName: input.displayName,
    level: input.level,
  })

  const habitId = await ensureHabit({
    userId: input.userId,
    title: input.habitTitle,
    categoryKey: input.categoryKey,
    streakDays: input.streakDays,
  })

  const imageUrl = await uploadPostImage(input.userId, input.image)
  const post = await createPostRecord({
    userId: input.userId,
    habitId,
    imageUrl,
    caption: input.caption,
  })

  if (!post) throw new Error('Publicación creada pero sin datos de perfil')
  return post
}
