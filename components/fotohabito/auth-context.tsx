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
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getOAuthRedirectTo } from '@/lib/supabase/oauth'
import { ensureProfile } from '@/lib/supabase/posts'

export type AuthProviderId = 'email' | 'google' | 'apple'

export type AuthUser = {
  id: string
  email: string
  name: string
  provider: AuthProviderId
}

type AuthContextValue = {
  user: AuthUser | null
  ready: boolean
  isAuthenticated: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  signupWithEmail: (email: string, password: string, name?: string) => Promise<void>
  continueWithGoogle: () => Promise<void>
  continueWithApple: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'Usuario'
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 40)
}

function mapAuthUser(user: User): AuthUser {
  const email = user.email?.trim().toLowerCase() || ''
  const metaName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
    ''
  const providerRaw = user.app_metadata?.provider
  const provider: AuthProviderId =
    providerRaw === 'google' ? 'google' : providerRaw === 'apple' ? 'apple' : 'email'

  return {
    id: user.id,
    email,
    name: (metaName || nameFromEmail(email) || 'Usuario').slice(0, 40),
    provider,
  }
}

async function syncProfile(session: Session | null) {
  if (!session?.user) return
  const mapped = mapAuthUser(session.user)
  try {
    await ensureProfile({
      id: mapped.id,
      displayName: mapped.name,
    })
  } catch {
    /* El trigger de DB puede crear el perfil; no bloqueamos el login */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const session = data.session
      setUser(session?.user ? mapAuthUser(session.user) : null)
      setReady(true)
      void syncProfile(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapAuthUser(session.user) : null)
      setReady(true)
      void syncProfile(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase()
    if (!normalized || password.length < 8) {
      throw new Error('Revisa tu correo y contraseña.')
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })
    if (error) throw new Error(error.message)
  }, [])

  const signupWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      const normalized = email.trim().toLowerCase()
      if (!normalized || password.length < 8) {
        throw new Error('Completa un correo válido y una contraseña segura.')
      }
      const displayName = (name?.trim() || nameFromEmail(normalized)).slice(0, 40)
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          data: { full_name: displayName, name: displayName },
          emailRedirectTo:
            typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      })
      if (error) throw new Error(error.message)

      if (data.user && !data.session) {
        throw new Error(
          'Revisa tu correo para confirmar la cuenta y luego inicia sesión.',
        )
      }

      if (data.user) {
        await ensureProfile({
          id: data.user.id,
          displayName,
        })
      }
    },
    [],
  )

  const continueWithGoogle = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthRedirectTo('google'),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) throw new Error(error.message)
    // Con skipBrowserRedirect false (default), Supabase redirige al proveedor.
    // Si no hay URL, algo falló en la config del provider.
    if (!data?.url) {
      throw new Error(
        'No se pudo iniciar Google. Revisa que el provider esté activo en Supabase.',
      )
    }
  }, [])

  const continueWithApple = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: getOAuthRedirectTo('apple'),
        scopes: 'name email',
      },
    })
    if (error) {
      throw new Error(
        error.message ||
          'Apple Sign In no está configurado en Supabase. Usa Google o el correo.',
      )
    }
    if (!data?.url) {
      throw new Error(
        'No se pudo iniciar Apple. Revisa que el provider esté activo en Supabase.',
      )
    }
  }, [])

  const logout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      loginWithEmail,
      signupWithEmail,
      continueWithGoogle,
      continueWithApple,
      logout,
    }),
    [
      user,
      ready,
      loginWithEmail,
      signupWithEmail,
      continueWithGoogle,
      continueWithApple,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
