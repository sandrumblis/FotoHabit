'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { BrandLogo } from './brand-logo'
import { LegalModal } from './legal-modal'
import { useAuth } from './auth-context'
import type { LegalDocId } from '@/lib/legal-content'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'signup'

const inputClass = cn(
  'h-11 w-full rounded-2xl border border-white/12 bg-background/80 py-2 pl-10 pr-3 text-sm text-foreground',
  'placeholder:text-muted-foreground/70 outline-none transition-all',
  'focus:border-neon-cyan/55 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-neon-cyan)_18%,transparent)]',
)

function validateEmail(value: string) {
  const v = value.trim()
  if (!v) return 'Introduce tu correo electrónico'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El correo no es válido'
  return null
}

function validatePassword(value: string, mode: Mode) {
  if (!value) return 'Introduce tu contraseña'
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (mode === 'signup' && !/\d/.test(value)) return 'Incluye al menos un número'
  return null
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.02-.8.86-2.12 1.52-3.22 1.43-.12-1.1.4-2.26 1.16-3.06.82-.88 2.24-1.52 3.24-1.39zM20.9 17.36c-.58 1.34-.86 1.93-1.6 3.11-1.04 1.64-2.5 3.68-4.32 3.7-1.62.02-2.04-1.06-4.24-1.05-2.2.01-2.66 1.07-4.28 1.05-1.82-.02-3.22-1.86-4.26-3.5C.64 17.68-.5 13.4.9 10.5c.9-1.86 2.32-3.04 3.96-3.04 1.48 0 2.42.98 4.16.98 1.68 0 2.42-.98 4.16-.98 1.46 0 2.74.8 3.66 2.18-3.22 1.76-2.7 6.34.06 8.72z" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
      />
      <path fill="#34A853" d="M3.9 14.4l3.2-2.5C8 14.3 10 15.4 12 15.4c1.2 0 2-.3 2.6-.7l3.1 2.4c-1.8 1.7-4.2 2.7-7.1 2.7-3.7 0-6.8-2.1-8.1-5.4z" />
      <path
        fill="#4A90E2"
        d="M20.6 10.6H12v3.9h5.5c-.4 1.5-1.5 2.6-2.9 3.2l3.1 2.4c1.9-1.7 3-4.3 3-7.3 0-.6-.1-1.1-.1-1.6z"
      />
      <path
        fill="#FBBC05"
        d="M7.1 11.9c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.9 5.4C3.2 6.9 2.8 8.5 2.8 10.2c0 1.7.4 3.3 1.1 4.8l3.2-3.1z"
      />
    </svg>
  )
}

export function AuthScreen() {
  const { loginWithEmail, signupWithEmail, continueWithApple, continueWithGoogle } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const description = params.get('error_description')
    if (err === 'auth' || err === 'access_denied') {
      setFormError(
        description?.replace(/\+/g, ' ') ||
          'No se pudo completar el acceso con Google o Apple. Inténtalo de nuevo.',
      )
      const clean = new URL(window.location.href)
      clean.searchParams.delete('error')
      clean.searchParams.delete('error_description')
      clean.searchParams.delete('error_code')
      window.history.replaceState({}, '', clean.pathname)
    }
  }, [])

  const emailError = useMemo(() => validateEmail(email), [email])
  const passwordError = useMemo(() => validatePassword(password, mode), [password, mode])
  const confirmError = useMemo(() => {
    if (mode !== 'signup') return null
    if (!confirm) return 'Confirma tu contraseña'
    if (confirm !== password) return 'Las contraseñas no coinciden'
    return null
  }, [confirm, password, mode])
  const nameError = useMemo(() => {
    if (mode !== 'signup') return null
    if (!name.trim()) return 'Introduce tu nombre'
    return null
  }, [mode, name])

  const legalError =
    mode === 'signup' && !acceptedLegal
      ? 'Debes aceptar los Términos y la Política de Privacidad'
      : null

  const canSubmit =
    !emailError &&
    !passwordError &&
    (mode === 'login' || (!confirmError && !nameError && acceptedLegal)) &&
    !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ email: true, password: true, confirm: true, name: true, legal: true })
    if (
      emailError ||
      passwordError ||
      (mode === 'signup' && (confirmError || nameError || !acceptedLegal))
    ) {
      if (mode === 'signup' && !acceptedLegal) {
        setFormError('Marca la casilla para aceptar Términos y Política de Privacidad.')
      }
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      if (mode === 'login') await loginWithEmail(email, password)
      else await signupWithEmail(email, password, name)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo completar el acceso. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOAuth(provider: 'apple' | 'google') {
    if (mode === 'signup' && !acceptedLegal) {
      setTouched((t) => ({ ...t, legal: true }))
      setFormError('Marca la casilla para aceptar Términos y Política de Privacidad.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      if (provider === 'apple') await continueWithApple()
      else await continueWithGoogle()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo conectar. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setFormError(null)
    setTouched({})
    setConfirm('')
    setShowConfirmPassword(false)
    if (next === 'login') setAcceptedLegal(false)
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-neon-cyan/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-10 size-80 rounded-full bg-neon-fuchsia/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent"
      />

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-8 flex w-full flex-col items-center justify-center text-center">
          <BrandLogo size="md" layout="stacked" className="mx-auto" />
          <p className="mt-5 max-w-sm text-balance text-sm text-muted-foreground">
            Entra para validar hábitos con prueba visual y crecer con la comunidad.
          </p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-card/90 p-5 shadow-[0_0_50px_-18px_rgba(0,240,255,0.35)] backdrop-blur-xl sm:p-6">
          <div
            role="tablist"
            aria-label="Acceso"
            className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-background/60 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={cn(
                'h-10 rounded-xl text-sm font-semibold transition-all',
                mode === 'login'
                  ? 'bg-neon-cyan/15 text-neon-cyan shadow-[0_0_20px_-8px_var(--color-neon-cyan)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => switchMode('signup')}
              className={cn(
                'h-10 rounded-xl text-sm font-semibold transition-all',
                mode === 'signup'
                  ? 'bg-neon-fuchsia/15 text-neon-fuchsia shadow-[0_0_20px_-8px_var(--color-neon-fuchsia)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Registrarse
            </button>
          </div>

          {mode === 'signup' ? (
            <div className="mb-4 rounded-2xl border border-white/10 bg-background/50 px-3 py-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => {
                    setAcceptedLegal(e.target.checked)
                    setTouched((t) => ({ ...t, legal: true }))
                    if (e.target.checked) setFormError(null)
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded border-white/30 accent-[var(--color-neon-cyan)]"
                  required
                />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  He leído y acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('terms')}
                    className="font-medium text-neon-cyan underline-offset-2 hover:underline"
                  >
                    Términos y Condiciones
                  </button>{' '}
                  y la{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('privacy')}
                    className="font-medium text-neon-cyan underline-offset-2 hover:underline"
                  >
                    Política de Privacidad
                  </button>
                  .
                </span>
              </label>
              {touched.legal && legalError ? (
                <p className="mt-2 text-[11px] text-red-300">{legalError}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex w-full flex-col items-stretch gap-2.5">
            <button
              type="button"
              disabled={submitting || (mode === 'signup' && !acceptedLegal)}
              onClick={() => void handleOAuth('google')}
              className={cn(
                'relative inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl',
                'border border-white/15 bg-background/80 text-sm font-semibold text-foreground',
                'shadow-[0_0_24px_-12px_rgba(0,240,255,0.35)] transition-all',
                'hover:scale-[1.01] hover:border-neon-cyan/45 hover:bg-neon-cyan/5',
                'disabled:pointer-events-none disabled:opacity-60',
              )}
            >
              <GoogleIcon className="absolute left-4 size-5" />
              <span>Continuar con Google</span>
            </button>
            <button
              type="button"
              disabled={submitting || (mode === 'signup' && !acceptedLegal)}
              onClick={() => void handleOAuth('apple')}
              className={cn(
                'relative inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl',
                'border border-white/10 bg-white text-sm font-semibold text-black',
                'transition-all hover:scale-[1.01] hover:bg-white/95',
                'disabled:pointer-events-none disabled:opacity-60',
              )}
            >
              <AppleIcon className="absolute left-4 size-5" />
              <span>Continuar con Apple</span>
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              o con correo
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3.5" noValidate>
            {mode === 'signup' ? (
              <Field
                label="Nombre"
                icon={<User className="size-4" aria-hidden="true" />}
                error={touched.name ? nameError : null}
                ok={Boolean(touched.name && !nameError)}
              >
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  placeholder="Laura"
                  className={inputClass}
                />
              </Field>
            ) : null}

            <Field
              label="Correo electrónico"
              icon={<Mail className="size-4" aria-hidden="true" />}
              error={touched.email ? emailError : null}
              ok={Boolean(touched.email && !emailError)}
            >
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="tu@email.com"
                className={inputClass}
              />
            </Field>

            <Field
              label="Contraseña"
              icon={<Lock className="size-4" aria-hidden="true" />}
              error={touched.password ? passwordError : null}
              ok={Boolean(touched.password && !passwordError)}
            >
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="Mínimo 8 caracteres"
                  className={cn(inputClass, 'pr-11')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </Field>

            {mode === 'signup' ? (
              <Field
                label="Confirmar contraseña"
                icon={<Lock className="size-4" aria-hidden="true" />}
                error={touched.confirm ? confirmError : null}
                ok={Boolean(touched.confirm && !confirmError)}
              >
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                    placeholder="Repite la contraseña"
                    className={cn(inputClass, 'pr-11')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirmPassword
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </Field>
            ) : null}

            {formError ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-background transition-transform',
                'bg-neon-cyan shadow-[0_0_32px_-6px_var(--color-neon-cyan)] hover:scale-[1.01]',
                'disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Accediendo…
                </>
              ) : mode === 'login' ? (
                'Entrar a FotoHabit'
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === 'login' ? (
              <>
                ¿Nuevo en FotoHabit?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-medium text-neon-cyan hover:underline"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-medium text-neon-fuchsia hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>

          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-muted-foreground/80">
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="hover:text-neon-cyan hover:underline"
            >
              Privacidad
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="hover:text-neon-cyan hover:underline"
            >
              Términos
            </button>
          </p>
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  )
}

function Field({
  label,
  icon,
  error,
  ok,
  children,
}: {
  label: string
  icon: ReactNode
  error?: string | null
  ok?: boolean
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="relative block">
        <span
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2',
            error ? 'text-red-300' : ok ? 'text-neon-lime' : 'text-muted-foreground',
          )}
        >
          {icon}
        </span>
        {children}
      </span>
      {error ? (
        <span className="text-[11px] text-red-300">{error}</span>
      ) : ok ? (
        <span className="text-[11px] text-neon-lime">Correcto</span>
      ) : null}
    </label>
  )
}
