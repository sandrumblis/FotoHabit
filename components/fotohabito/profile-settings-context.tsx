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

const STORAGE_KEY = 'fotohabito.profile.bio'

function readStoredBio(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw == null) return ''
    return raw.slice(0, PROFILE_BIO_MAX_LENGTH)
  } catch {
    return ''
  }
}

type ProfileSettingsContextValue = {
  /** Texto guardado (puede estar vacío). */
  bioDraft: string
  /** Texto a mostrar: custom o frase por defecto. */
  bio: string
  setBio: (next: string) => void
}

const ProfileSettingsContext = createContext<ProfileSettingsContextValue | null>(null)

export function ProfileSettingsProvider({ children }: { children: ReactNode }) {
  const [bioDraft, setBioDraft] = useState('')

  useEffect(() => {
    setBioDraft(readStoredBio())
  }, [])

  const setBio = useCallback((next: string) => {
    const trimmed = next.slice(0, PROFILE_BIO_MAX_LENGTH)
    setBioDraft(trimmed)
    try {
      if (trimmed.trim().length === 0) {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        window.localStorage.setItem(STORAGE_KEY, trimmed)
      }
    } catch {
      /* noop */
    }
  }, [])

  const value = useMemo(
    () => ({
      bioDraft,
      bio: bioDraft.trim().length > 0 ? bioDraft.trim() : DEFAULT_PROFILE_BIO,
      setBio,
    }),
    [bioDraft, setBio],
  )

  return (
    <ProfileSettingsContext.Provider value={value}>
      {children}
    </ProfileSettingsContext.Provider>
  )
}

export function useProfileSettings() {
  const ctx = useContext(ProfileSettingsContext)
  if (!ctx) {
    throw new Error('useProfileSettings must be used within ProfileSettingsProvider')
  }
  return ctx
}
