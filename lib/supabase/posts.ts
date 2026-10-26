import type { HabitAccent } from '@/lib/community-data'
import { createClient } from './client'
import type { PostWithRelations } from './database.types'
import { mapPostRow } from './mappers'

const POSTS_BUCKET = 'posts'

const FEED_SELECT = `
  id,
  user_id,
  habit_id,
  image_url,
  caption,
  likes_count,
  created_at,
  profiles:user_id (
    id,
    display_name,
    avatar_url,
    bio,
    accent,
    created_at
  ),
  habits:habit_id (
    id,
    user_id,
    title,
    category_key,
    accent,
    streak_days,
    level,
    created_at
  )
`

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(header ?? '')?.[1] ?? 'image/jpeg'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function ensureProfile(input: {
  id: string
  displayName: string
  accent?: string
}) {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').upsert(
    {
      id: input.id,
      display_name: input.displayName,
      accent: input.accent ?? 'cyan',
    },
    { onConflict: 'id' },
  )
  if (error) throw new Error(error.message)
}

export async function ensureHabit(input: {
  userId: string
  title: string
  categoryKey?: string
  accent?: HabitAccent
  streakDays?: number
  level?: number
}) {
  const supabase = createClient()

  if (input.categoryKey) {
    const { data: existing } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', input.userId)
      .eq('category_key', input.categoryKey)
      .maybeSingle()

    if (existing?.id) {
      await supabase
        .from('habits')
        .update({
          title: input.title,
          accent: input.accent ?? 'cyan',
          streak_days: input.streakDays ?? 0,
          level: input.level ?? 1,
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
      category_key: input.categoryKey ?? null,
      accent: input.accent ?? 'cyan',
      streak_days: input.streakDays ?? 0,
      level: input.level ?? 1,
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

  const { error: uploadError } = await supabase.storage
    .from(POSTS_BUCKET)
    .upload(path, blob, {
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
      likes_count: 0,
    })
    .select(FEED_SELECT)
    .single()

  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la publicación')
  return mapPostRow(data as PostWithRelations)
}

export async function fetchCommunityFeed() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(FEED_SELECT)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) throw new Error(error.message)

  return (data as PostWithRelations[] | null)
    ?.map(mapPostRow)
    .filter((p): p is NonNullable<typeof p> => Boolean(p)) ?? []
}

export async function publishValidatedPhoto(input: {
  userId: string
  displayName: string
  habitTitle: string
  categoryKey?: string
  accent: HabitAccent
  caption: string
  streakDays: number
  level: number
  image: string | Blob
}) {
  await ensureProfile({
    id: input.userId,
    displayName: input.displayName,
    accent: input.accent,
  })

  const habitId = await ensureHabit({
    userId: input.userId,
    title: input.habitTitle,
    categoryKey: input.categoryKey,
    accent: input.accent,
    streakDays: input.streakDays,
    level: input.level,
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
