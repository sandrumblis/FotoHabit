'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { useProfileSettings } from './profile-settings-context'
import { PROFILE_BIO_MAX_LENGTH } from '@/lib/community-data'
import { cn } from '@/lib/utils'

type EditableProfileBioProps = {
  /** Solo el perfil propio puede editar. */
  editable?: boolean
  /** Bio estática (perfiles ajenos). */
  fallbackBio?: string
  className?: string
}

export function EditableProfileBio({
  editable = false,
  fallbackBio,
  className,
}: EditableProfileBioProps) {
  const { bio, bioDraft, setBio } = useProfileSettings()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(bioDraft)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const labelId = useId()

  const display = editable ? bio : (fallbackBio ?? bio)

  useEffect(() => {
    if (!editing) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [editing])

  function startEdit() {
    if (!editable) return
    setDraft(bioDraft.trim().length > 0 ? bioDraft : bio)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setDraft(bioDraft)
  }

  function save() {
    setBio(draft.trim())
    setEditing(false)
  }

  if (!editable) {
    return (
      <p className={cn('max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground', className)}>
        {display}
      </p>
    )
  }

  if (editing) {
    return (
      <div className={cn('flex max-w-lg flex-col gap-2', className)}>
        <label htmlFor={labelId} className="sr-only">
          Biografía del perfil
        </label>
        <textarea
          id={labelId}
          ref={textareaRef}
          value={draft}
          maxLength={PROFILE_BIO_MAX_LENGTH}
          rows={3}
          onChange={(e) => setDraft(e.target.value.slice(0, PROFILE_BIO_MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              save()
            }
          }}
          placeholder="Escribe tu bio (máx. 120 caracteres)…"
          className={cn(
            'w-full resize-none rounded-2xl border border-neon-cyan/40 bg-background/70 px-3 py-2.5',
            'text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70',
            'shadow-[0_0_24px_-12px_var(--color-neon-cyan)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
          )}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {draft.length}/{PROFILE_BIO_MAX_LENGTH}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={cancel}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-white/10 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" aria-hidden="true" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-neon-cyan/45 bg-neon-cyan/10 px-2.5 text-xs font-medium text-neon-cyan shadow-[0_0_16px_-8px_var(--color-neon-cyan)]"
            >
              <Check className="size-3" aria-hidden="true" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('group/bio flex max-w-lg items-start gap-2', className)}>
      <button
        type="button"
        onClick={startEdit}
        className={cn(
          'min-w-0 flex-1 rounded-xl text-left text-pretty text-sm leading-relaxed text-muted-foreground',
          'transition-colors hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
        )}
        aria-label="Editar biografía"
      >
        {display}
      </button>
      <button
        type="button"
        onClick={startEdit}
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-background/50 px-2 py-1',
          'font-mono text-[9px] uppercase tracking-wider text-muted-foreground',
          'opacity-80 transition-all hover:border-neon-cyan/40 hover:text-neon-cyan group-hover/bio:opacity-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
        )}
        aria-label="Editar perfil"
      >
        <Pencil className="size-3" aria-hidden="true" />
        Editar
      </button>
    </div>
  )
}
