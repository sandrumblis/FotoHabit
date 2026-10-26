'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Camera, Loader2, Scale, Settings2, UserRound, X } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import { LegalModal } from './legal-modal'
import { useProfileSettings } from './profile-settings-context'
import type { LegalDocId } from '@/lib/legal-content'
import { cn } from '@/lib/utils'

export function ProfileSettingsModal() {
  const titleId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    settingsOpen,
    closeSettings,
    displayName,
    avatarUrl,
    initials,
    saving,
    uploadingAvatar,
    error,
    saveDisplayName,
    uploadAvatar,
  } = useProfileSettings()

  const [nameDraft, setNameDraft] = useState(displayName)
  const [localError, setLocalError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null)

  useEffect(() => {
    if (settingsOpen) {
      setNameDraft(displayName)
      setLocalError(null)
      setSavedFlash(false)
    }
  }, [settingsOpen, displayName])

  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [settingsOpen, closeSettings])

  if (!settingsOpen) return null

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setLocalError('Escribe un nombre de perfil')
      return
    }
    try {
      await saveDisplayName(trimmed)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2200)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  async function handleAvatarFile(file: File | undefined) {
    if (!file) return
    setLocalError(null)
    try {
      await uploadAvatar(file)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2200)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const busy = saving || uploadingAvatar
  const showError = localError || error

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar ajustes"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeSettings}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-card shadow-[0_0_60px_-16px_rgba(0,240,255,0.35)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
        />

        <header className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
              <Settings2 className="size-3" aria-hidden="true" />
              Ajustes
            </p>
            <h2
              id={titleId}
              className="mt-1 text-xl font-semibold tracking-tight text-foreground"
            >
              Editar perfil
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nombre y foto que se verán en el feed de la comunidad.
            </p>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <CommunityAvatar
                initials={initials}
                src={avatarUrl}
                size="xl"
                accent="cyan"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full',
                  'border border-neon-cyan/50 bg-background text-neon-cyan shadow-[0_0_18px_-4px_var(--color-neon-cyan)]',
                  'transition hover:bg-neon-cyan/10 disabled:opacity-50',
                )}
                aria-label="Subir foto de perfil"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              className="sr-only"
              onChange={(e) => void handleAvatarFile(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-neon-cyan underline-offset-2 hover:underline disabled:opacity-50"
            >
              {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto'}
            </button>
          </div>

          <form onSubmit={(e) => void handleSaveName(e)} className="mt-6 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <UserRound className="size-3" aria-hidden="true" />
                Nombre de perfil
              </span>
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value.slice(0, 40))}
                maxLength={40}
                disabled={busy}
                className="h-12 rounded-2xl border border-white/10 bg-background/60 px-4 text-sm text-foreground outline-none ring-neon-cyan/40 placeholder:text-muted-foreground focus:border-neon-cyan/40 focus:ring-2 disabled:opacity-60"
                placeholder="Tu nombre en FotoHabit"
                autoComplete="nickname"
              />
            </label>

            {showError ? (
              <p className="text-sm text-red-300" role="alert">
                {showError}
              </p>
            ) : null}
            {savedFlash && !showError ? (
              <p className="text-sm text-neon-lime" role="status">
                Perfil actualizado. Se verá en el feed.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || nameDraft.trim() === displayName.trim()}
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neon-cyan text-sm font-semibold text-background shadow-[0_0_28px_-6px_var(--color-neon-cyan)] transition-transform hover:scale-[1.01] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Guardando…
                </>
              ) : (
                'Guardar nombre'
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-5">
            <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Scale className="size-3" aria-hidden="true" />
              Legal
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <button
                  type="button"
                  onClick={() => setLegalDoc('privacy')}
                  className="w-full rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-left text-sm text-foreground transition hover:border-neon-cyan/40"
                >
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalDoc('terms')}
                  className="w-full rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-left text-sm text-foreground transition hover:border-neon-cyan/40"
                >
                  Términos de Uso
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  )
}
