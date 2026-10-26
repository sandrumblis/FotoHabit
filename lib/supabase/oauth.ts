export type OAuthProvider = 'google' | 'apple'

/** Destino tras login social exitoso (feed / pantalla principal). */
export const OAUTH_SUCCESS_PATH = '/'

/**
 * URL de callback de la app. Debe estar en Supabase → Authentication → URL Configuration
 * (Redirect URLs), p. ej. http://localhost:3000/auth/callback y https://tu-dominio/auth/callback
 */
export function getOAuthRedirectTo(provider: OAuthProvider) {
  if (typeof window === 'undefined') {
    throw new Error('getOAuthRedirectTo solo puede usarse en el navegador')
  }
  const url = new URL('/auth/callback', window.location.origin)
  url.searchParams.set('next', OAUTH_SUCCESS_PATH)
  url.searchParams.set('provider', provider)
  return url.toString()
}
