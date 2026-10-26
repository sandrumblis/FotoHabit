import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para el frontend (Client Components / browser).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.',
    )
  }

  return createBrowserClient(url, anonKey)
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>
