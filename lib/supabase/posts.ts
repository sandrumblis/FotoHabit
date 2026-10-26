import type { HabitAccent } from '@/lib/community-data'
import { createClient } from './client'
import type { HabitRow, PostRow, PostWithRelations, ProfileRow } from './database.types'
import { mapPostRow, profileToCommunityUser, accentFromCategory } from './mappers'
import type { CommunityPost } from '@/lib/community-data'

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

function logPublishError(stage: string, err: unknown) {
  const detail =
    err && typeof err === 'object'
      ? {
          message: 'message' in err ? String((err as { message?: unknown }).message) : undefined,
          code: 'code' in err ? String((err as { code?: unknown }).code) : undefined,
          details: 'details' in err ? String((err as { details?: unknown }).details) : undefined,
          hint: 'hint' in err ? String((err as { hint?: unknown }).hint) : undefined,
          status: 'status' in err ? (err as { status?: unknown }).status : undefined,
          name: err instanceof Error ? err.name : undefined,
          stack: err instanceof Error ? err.stack : undefined,
        }
      : { raw: String(err) }
  console.error(`[FotoHabit publish · ${stage}]`, detail, err)
}

function toError(stage: string, err: unknown, fallback: string): Error {
  logPublishError(stage, err)
  if (err instanceof Error) {
    const msg = err.message || fallback
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return new Error(
        `${fallback} (red o blob no disponible). Revisa conexión, bucket «posts» y políticas RLS.`,
      )
    }
    return new Error(msg)
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return new Error(String((err as { message: unknown }).message) || fallback)
  }
  return new Error(fallback)
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

  if (profilesRes.error) {
    logPublishError('hydrate.profiles', profilesRes.error)
    throw new Error(profilesRes.error.message)
  }
  if (habitsRes.error) {
    logPublishError('hydrate.habits', habitsRes.error)
    throw new Error(habitsRes.error.message)
  }

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
  const username = input.displayName.trim().slice(0, 40) || 'Usuario FotoHabit'

  try {
    const { data: existing, error: readError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', input.id)
      .maybeSingle()

    if (readError) throw toError('ensureProfile.read', readError, 'No se pudo leer el perfil')

    if (existing?.id) {
      if (!existing.username?.trim() && username) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', input.id)
        if (updateError) {
          throw toError('ensureProfile.update', updateError, 'No se pudo actualizar el perfil')
        }
      }
      return
    }

    const insertRow: { id: string; username: string; level: number } = {
      id: input.id,
      username,
      level: 1,
    }

    const { error } = await supabase.from('profiles').insert(insertRow)
    if (error) {
      if (error.code === '23505' || error.message.toLowerCase().includes('duplicate')) {
        return
      }
      if (error.message.toLowerCase().includes('level')) {
        const { error: retryError } = await supabase
          .from('profiles')
          .insert({ id: insertRow.id, username: insertRow.username })
        if (
          retryError &&
          retryError.code !== '23505' &&
          !retryError.message.toLowerCase().includes('duplicate')
        ) {
          throw toError('ensureProfile.insert.retry', retryError, 'No se pudo crear el perfil')
        }
        return
      }
      throw toError('ensureProfile.insert', error, 'No se pudo crear el perfil')
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('No se pudo')) throw err
    throw toError('ensureProfile', err, 'Error al sincronizar el perfil')
  }
}

export async function ensureHabit(input: {
  userId: string
  title: string
  categoryKey?: string
  streakDays?: number
}) {
  const supabase = createClient()

  try {
    if (input.categoryKey) {
      const { data: existing, error: findError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', input.userId)
        .eq('category', input.categoryKey)
        .maybeSingle()

      if (findError) {
        logPublishError('ensureHabit.find', findError)
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('habits')
          .update({
            title: input.title,
            streak_days: input.streakDays ?? 0,
          })
          .eq('id', existing.id)
        if (updateError) {
          logPublishError('ensureHabit.update', updateError)
        }
        return existing.id as string
      }
    }

    const payload = {
      user_id: input.userId,
      title: input.title,
      category: input.categoryKey ?? null,
      streak_days: input.streakDays ?? 0,
    }

    const { data, error } = await supabase.from('habits').insert(payload).select('id').single()

    if (error || !data) {
      // Reintento mínimo por si `category` no existe en algún entorno.
      if (error?.message?.toLowerCase().includes('category')) {
        const { data: retry, error: retryError } = await supabase
          .from('habits')
          .insert({
            user_id: input.userId,
            title: input.title,
            streak_days: input.streakDays ?? 0,
          })
          .select('id')
          .single()
        if (retryError || !retry) {
          throw toError('ensureHabit.insert.retry', retryError ?? error, 'No se pudo crear el hábito')
        }
        return retry.id as string
      }
      throw toError('ensureHabit.insert', error, 'No se pudo crear el hábito')
    }

    return data.id as string
  } catch (err) {
    if (err instanceof Error) throw err
    throw toError('ensureHabit', err, 'No se pudo crear el hábito')
  }
}

async function resolveImageBlob(image: string | Blob): Promise<Blob> {
  if (typeof image !== 'string') return image

  if (image.startsWith('data:')) {
    return dataUrlToBlob(image)
  }

  // blob: revocado → Failed to fetch; mensaje claro.
  if (image.startsWith('blob:')) {
    try {
      const res = await fetch(image)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.blob()
    } catch (err) {
      throw toError(
        'upload.resolveBlob',
        err,
        'La vista previa de la foto ya no está disponible. Vuelve a capturar o elige la imagen de nuevo.',
      )
    }
  }

  try {
    const res = await fetch(image)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al leer la imagen`)
    }
    return await res.blob()
  } catch (err) {
    throw toError(
      'upload.resolveBlob',
      err,
      'No se pudo leer la foto para subirla.',
    )
  }
}

/** Reduce peso antes de Storage (evita timeouts / Failed to fetch en móvil). */
async function compressImageBlob(blob: Blob, maxEdge = 1600, quality = 0.82): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return blob
  if (!blob.type.startsWith('image/') || blob.type.includes('gif')) return blob

  try {
    const bitmap = await createImageBitmap(blob)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    if (scale >= 0.98 && blob.size < 900_000) {
      bitmap.close()
      return blob
    }
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return blob
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const compressed = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    return compressed && compressed.size > 0 ? compressed : blob
  } catch {
    return blob
  }
}

export async function uploadPostImage(userId: string, image: string | Blob) {
  const supabase = createClient()

  try {
    let blob = await resolveImageBlob(image)
    if (!blob || blob.size === 0) {
      throw new Error('La imagen está vacía')
    }
    blob = await compressImageBlob(blob)

    const ext = blob.type.includes('png')
      ? 'png'
      : blob.type.includes('webp')
        ? 'webp'
        : 'jpg'
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage.from(POSTS_BUCKET).upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: blob.type || 'image/jpeg',
    })

    if (uploadError) {
      const hint =
        /bucket|not found|does not exist/i.test(uploadError.message)
          ? ' Crea el bucket público «posts» en Supabase Storage.'
          : /policy|row-level|jwt|authorized/i.test(uploadError.message)
            ? ' Revisa las políticas RLS del bucket «posts» (upload autenticado).'
            : ''
      throw toError(
        'upload.storage',
        uploadError,
        `No se pudo subir la imagen al bucket «${POSTS_BUCKET}».${hint}`,
      )
    }

    const { data } = supabase.storage.from(POSTS_BUCKET).getPublicUrl(path)
    if (!data?.publicUrl) throw new Error('No se pudo obtener la URL pública de la imagen')
    return data.publicUrl
  } catch (err) {
    if (err instanceof Error) throw err
    throw toError('upload', err, 'Error al subir la imagen')
  }
}

function fallbackCommunityPost(
  row: PostRow,
  extras?: { displayName?: string; habitTitle?: string; categoryKey?: string; streakDays?: number; level?: number },
): CommunityPost {
  const accent = accentFromCategory(extras?.categoryKey)
  const author = profileToCommunityUser(
    {
      id: row.user_id,
      username: extras?.displayName ?? 'Usuario FotoHabit',
      avatar_url: null,
      level: extras?.level ?? 1,
      created_at: row.created_at,
    },
    {
      streak: extras?.streakDays ?? 0,
      primaryHabit: extras?.habitTitle ?? 'Hábito',
      accent,
    },
  )

  return {
    id: row.id,
    userId: row.user_id,
    habit: extras?.habitTitle ?? 'Hábito',
    accent,
    caption: row.caption ?? '',
    time: 'ahora',
    likes: 0,
    visibility: 'public',
    level: extras?.level,
    streakDays: extras?.streakDays,
    imageUrl: row.image_url,
    previewUrl: null,
    neonFire: false,
    comments: [],
    author,
  }
}

export async function createPostRecord(input: {
  userId: string
  habitId: string | null
  imageUrl: string
  caption: string
  /** Fallback si la hidratación falla (RLS / perfil). */
  fallback?: {
    displayName?: string
    habitTitle?: string
    categoryKey?: string
    streakDays?: number
    level?: number
  }
}) {
  const supabase = createClient()

  // Solo columnas reales de `posts` (nunca accent / display_name).
  const insertPayload = {
    user_id: input.userId,
    habit_id: input.habitId,
    image_url: input.imageUrl,
    caption: input.caption || null,
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert(insertPayload)
      .select(POST_COLUMNS)
      .single()

    if (error || !data) {
      throw toError('createPost.insert', error, 'No se pudo crear la publicación en posts')
    }

    const row = data as PostRow

    try {
      const [hydrated] = await hydratePosts([row])
      const mapped = mapPostRow(hydrated)
      if (mapped) return mapped
    } catch (hydrateErr) {
      logPublishError('createPost.hydrate', hydrateErr)
    }

    return fallbackCommunityPost(row, input.fallback)
  } catch (err) {
    if (err instanceof Error) throw err
    throw toError('createPost', err, 'Error al crear la publicación')
  }
}

export async function fetchCommunityFeed() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(POST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) {
    logPublishError('fetchCommunityFeed', error)
    throw new Error(error.message)
  }

  const hydrated = await hydratePosts((data as PostRow[] | null) ?? [])
  return hydrated.map(mapPostRow).filter((p): p is NonNullable<typeof p> => Boolean(p))
}

export async function publishValidatedPhoto(input: {
  userId: string
  displayName: string
  habitTitle: string
  categoryKey?: string
  /** Solo UI local; nunca se escribe en profiles/posts. */
  accent?: HabitAccent
  caption: string
  streakDays: number
  level: number
  image: string | Blob
}) {
  void input.accent

  try {
    await ensureProfile({
      id: input.userId,
      displayName: input.displayName,
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
      fallback: {
        displayName: input.displayName,
        habitTitle: input.habitTitle,
        categoryKey: input.categoryKey,
        streakDays: input.streakDays,
        level: input.level,
      },
    })

    if (!post) throw new Error('Publicación creada pero sin datos de perfil')
    return post
  } catch (err) {
    logPublishError('publishValidatedPhoto', err)
    throw err instanceof Error
      ? err
      : new Error('No se pudo publicar la foto en el feed')
  }
}
