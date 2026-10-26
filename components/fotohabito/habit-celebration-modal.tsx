'use client'

import { useEffect, useId, type CSSProperties } from 'react'
import { Flame, Sparkles, Trophy, X } from 'lucide-react'
import { ShareAchievement } from './share-achievement'
import { HABIT_MOTTO } from '@/lib/community-data'
import { getLevelMeta } from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

export type CelebrationKind = 'habit-created' | 'level-up'

type HabitCelebrationModalProps = {
  open: boolean
  kind: CelebrationKind | null
  level: number
  day: number
  categoryTitle: string
  glowColor?: string
  photoUrl?: string | null
  onClose: () => void
}

export function HabitCelebrationModal({
  open,
  kind,
  level,
  day,
  categoryTitle,
  glowColor = 'var(--color-neon-cyan)',
  photoUrl,
  onClose,
}: HabitCelebrationModalProps) {
  const titleId = useId()
  const meta = getLevelMeta(level)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !kind) return null

  const isHabitCreated = kind === 'habit-created'
  const habitLabel = categoryTitle.split('·')[0]?.trim() || categoryTitle

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ '--glow': glowColor } as CSSProperties}
        className={cn(
          'relative z-10 flex max-h-[min(94dvh,860px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[color-mix(in_oklab,var(--glow)_55%,transparent)] bg-card shadow-[0_0_80px_-12px_var(--glow)]',
          'animate-in fade-in zoom-in-95 duration-500',
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--glow)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 size-48 animate-pulse rounded-full bg-[var(--glow)] opacity-30 blur-3xl"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Cerrar celebración"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative flex size-16 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--glow)_50%,transparent)] bg-[color-mix(in_oklab,var(--glow)_15%,transparent)] shadow-[0_0_40px_-4px_var(--glow)]">
              {isHabitCreated ? (
                <Trophy className="size-7 text-[var(--glow)]" aria-hidden="true" />
              ) : (
                <Sparkles className="size-7 text-[var(--glow)]" aria-hidden="true" />
              )}
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--glow)]">
              {isHabitCreated ? 'Hábito creado' : '¡Nivel alcanzado!'}
            </p>

            <h2
              id={titleId}
              className="text-balance text-2xl font-semibold tracking-tight text-foreground"
            >
              {isHabitCreated ? '¡Enhorabuena!' : `Nivel ${level}`}
            </h2>

            <p className="font-mono text-sm text-neon-yellow">
              {meta.name} · Día {day}
            </p>

            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              {isHabitCreated
                ? 'Has completado el ciclo de 21 días y has creado el hábito. Comparte tu logro con el mundo.'
                : `Has cerrado el bloque de ${categoryTitle}. ${meta.focus}.`}
            </p>
          </div>

          <div className="mt-5">
            <ShareAchievement
              compact
              data={{
                photoUrl,
                habit: habitLabel,
                level,
                streakDays: day,
                title: isHabitCreated ? '¡Hábito creado!' : `Nivel ${level} alcanzado`,
                subtitle: `${meta.name} · ${HABIT_MOTTO}`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--glow)] px-6 text-sm font-semibold text-background shadow-[0_0_32px_-6px_var(--glow)] transition-transform hover:scale-[1.02]"
          >
            {isHabitCreated ? 'Seguir en modo libre' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
