import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { OAUTH_SUCCESS_PATH } from '@/lib/supabase/oauth'

/**
 * Callback OAuth (Google / Apple).
 * Intercambia ?code= por sesión, escribe cookies en la redirect y manda al feed (/).
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? OAUTH_SUCCESS_PATH
  const next =
    nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : OAUTH_SUCCESS_PATH

  const failRedirect = (message: string) => {
    const fail = new URL('/', origin)
    fail.searchParams.set('error', 'auth')
    fail.searchParams.set('error_description', message)
    return NextResponse.redirect(fail)
  }

  if (!url || !anonKey) {
    return failRedirect('Faltan variables de entorno de Supabase')
  }

  if (!code) {
    return failRedirect('Falta el código de autorización OAuth')
  }

  try {
    // Importante: las cookies de sesión deben ir en ESTA respuesta de redirect
    const redirectResponse = NextResponse.redirect(new URL(next, origin))

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return failRedirect(error.message || 'No se pudo completar el acceso social')
    }

    return redirectResponse
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error inesperado en el callback OAuth'
    return failRedirect(message)
  }
}
