import { createClient } from './client'
import type { ProfileRow } from './database.types'

const AVATARS_BUCKET = 'avatars'
const POSTS_BUCKET = 'posts'

export async function fetchMyProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, level, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[profile] fetch', error)
    throw new Error(error.message)
  }
  return (data as ProfileRow | null) ?? null
}

export async function updateMyProfile(input: {
  userId: string
  username?: string
  avatarUrl?: string | null
}): Promise<ProfileRow> {
  const supabase = createClient()
  const patch: { username?: string; avatar_url?: string | null } = {}

  if (typeof input.username === 'string') {
    const name = input.username.trim().slice(0, 40)
    if (!name) throw new Error('El nombre no puede estar vacío')
    patch.username = name
  }
  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl
  }

  if (Object.keys(patch).length === 0) {
    const current = await fetchMyProfile(input.userId)
    if (!current) throw new Error('Perfil no encontrado')
    return current
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', input.userId)
    .select('id, username, avatar_url, level, created_at')
    .single()

  if (error || !data) {
    console.error('[profile] update', error)
    throw new Error(error?.message ?? 'No se pudo actualizar el perfil')
  }

  // Mejor esfuerzo: sincronizar metadata de auth (nombre visible en sesión).
  if (patch.username) {
    try {
      await supabase.auth.updateUser({
        data: { full_name: patch.username, name: patch.username },
      })
    } catch (err) {
      console.warn('[profile] auth metadata sync skipped', err)
    }
  }

  return data as ProfileRow
}

async function uploadToBucket(
  bucket: string,
  path: string,
  blob: Blob,
): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '3600',
    upsert: true,
    contentType: blob.type || 'image/jpeg',
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('No se pudo obtener la URL del avatar')
  return data.publicUrl
}

/** Sube avatar a Storage y actualiza profiles.avatar_url. */
export async function uploadAvatarImage(userId: string, file: File | Blob) {
  if (!file || file.size === 0) throw new Error('Selecciona una imagen')
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen es demasiado grande (máx. 5 MB)')
  }
  const type = 'type' in file ? file.type : ''
  if (type && !type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }

  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
  const path = `${userId}/avatar-${Date.now()}.${ext}`

  let publicUrl: string
  try {
    publicUrl = await uploadToBucket(AVATARS_BUCKET, path, file)
  } catch (primaryErr) {
    console.warn('[profile] avatars bucket failed, trying posts/', primaryErr)
    // Fallback: bucket posts (ya usado por la app) bajo prefijo avatars/
    publicUrl = await uploadToBucket(POSTS_BUCKET, `avatars/${path}`, file)
  }

  return updateMyProfile({ userId, avatarUrl: publicUrl })
}
