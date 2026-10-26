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
import {
  DEFAULT_PROFILE_BIO,
  PROFILE_BIO_MAX_LENGTH,
} from '@/lib/community-data'
import { fetchMyProfile, updateMyProfile, uploadAvatarImage } from '@/lib/supabase/profile'
import { useAuth } from './auth-context'

const BIO_STORAGE_KEY = 'fotohabito.profile.bio'

function readStoredBio(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.localStorage.getItem(BIO_STORAGE_KEY)
    if (raw == null) return ''
    return raw.slice(0, PROFILE_BIO_MAX_LENGTH)
  } catch {
    return ''
  }
}

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'FH'
  )
}

type ProfileSettingsContextValue = {
  bioDraft: string
  bio: string
  setBio: (next: string) => void
  displayName: string
  avatarUrl: string | null
  initials: string
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  saving: boolean
  uploadingAvatar: boolean
  error: string | null
  saveDisplayName: (name: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  refreshProfile: () => Promise<void>
  /** Incrementa cuando el perfil cambia (feed puede refrescar autores). */
  profileRevision: number
}

const ProfileSettingsContext = createContext<ProfileSettingsContextValue | null>(null)

export function ProfileSettingsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [bioDraft, setBioDraft] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileRevision, setProfileRevision] = useState(0)

  useEffect(() => {
    setBioDraft(readStoredBio())
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setDisplayName('')
      setAvatarUrl(null)
      return
    }
    try {
      const profile = await fetchMyProfile(user.id)
      const name = profile?.username?.trim() || user.name || 'Usuario FotoHabit'
      setDisplayName(name)
      setAvatarUrl(profile?.avatar_url?.trim() || null)
      setError(null)
    } catch (err) {
      console.warn('[profile-settings] refresh', err)
      setDisplayName(user.name || 'Usuario FotoHabit')
    }
  }, [user?.id, user?.name])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setDisplayName('')
      setAvatarUrl(null)
      return
    }
    setDisplayName(user.name || 'Usuario FotoHabit')
    void refreshProfile()
  }, [isAuthenticated, user?.id, user?.name, refreshProfile])

  const setBio = useCallback((next: string) => {
    const trimmed = next.slice(0, PROFILE_BIO_MAX_LENGTH)
    setBioDraft(trimmed)
    try {
      if (trimmed.trim().length === 0) {
        window.localStorage.removeItem(BIO_STORAGE_KEY)
      } else {
        window.localStorage.setItem(BIO_STORAGE_KEY, trimmed)
      }
    } catch {
      /* noop */
    }
  }, [])

  const saveDisplayName = useCallback(
    async (name: string) => {
      if (!user?.id) throw new Error('Debes iniciar sesión')
      setSaving(true)
      setError(null)
      try {
        const updated = await updateMyProfile({ userId: user.id, username: name })
        setDisplayName(updated.username?.trim() || name.trim())
        setProfileRevision((n) => n + 1)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo guardar el nombre'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [user?.id],
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) throw new Error('Debes iniciar sesión')
      setUploadingAvatar(true)
      setError(null)
      try {
        const updated = await uploadAvatarImage(user.id, file)
        setAvatarUrl(updated.avatar_url?.trim() || null)
        if (updated.username?.trim()) setDisplayName(updated.username.trim())
        setProfileRevision((n) => n + 1)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo subir el avatar'
        setError(message)
        throw err
      } finally {
        setUploadingAvatar(false)
      }
    },
    [user?.id],
  )

  const value = useMemo(
    () => ({
      bioDraft,
      bio: bioDraft.trim().length > 0 ? bioDraft.trim() : DEFAULT_PROFILE_BIO,
      setBio,
      displayName: displayName || user?.name || 'Usuario FotoHabit',
      avatarUrl,
      initials: initialsFromName(displayName || user?.name || 'FH'),
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => {
        setSettingsOpen(false)
        setError(null)
      },
      saving,
      uploadingAvatar,
      error,
      saveDisplayName,
      uploadAvatar,
      refreshProfile,
      profileRevision,
    }),
    [
      bioDraft,
      setBio,
      displayName,
      user?.name,
      avatarUrl,
      settingsOpen,
      saving,
      uploadingAvatar,
      error,
      saveDisplayName,
      uploadAvatar,
      refreshProfile,
      profileRevision,
    ],
  )

  return (
    <ProfileSettingsContext.Provider value={value}>{children}</ProfileSettingsContext.Provider>
  )
}

export function useProfileSettings() {
  const ctx = useContext(ProfileSettingsContext)
  if (!ctx) {
    throw new Error('useProfileSettings must be used within ProfileSettingsProvider')
  }
  return ctx
}
