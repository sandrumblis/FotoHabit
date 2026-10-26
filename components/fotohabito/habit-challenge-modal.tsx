'use client'

import { useEffect, useId, useRef, type CSSProperties, type RefObject } from 'react'
import { Camera, Check, Lock, Sparkles, X } from 'lucide-react'
import {
  getCategoryMeta,
  getCurrentDay,
  type DailyChallenge,
  type HabitCategoryId,
} from '@/lib/habit-challenges'
import {
  formatLevelHeadline,
  getCurrentLevel,
  getDayInLevel,
  getLevelBlockProgress,
  getLevelMeta,
  getRoadmapWeeks,
  LEVEL_BLOCK_DAYS,
  isMaintenanceDay,
} from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

type HabitChallengeModalProps = {
  open: boolean
  categoryId: HabitCategoryId | null
  completed: number
  onClose: () => void
  onCapture?: () => void
}

export function HabitChallengeModal({
  open,
  categoryId,
  completed,
  onClose,
  onCapture,
}: HabitChallengeModalProps) {
  const titleId = useId()
  const currentRef = useRef<HTMLLIElement>(null)

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

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => {
      currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => window.clearTimeout(id)
  }, [open, categoryId, completed])

  if (!open || !categoryId) return null

  const meta = getCategoryMeta(categoryId)
  const currentDay = getCurrentDay(completed)
  const level = getCurrentLevel(completed)
  const levelMeta = getLevelMeta(level)
  const blockProgress = getLevelBlockProgress(Math.max(completed, 0))
  const dayInLevel = getDayInLevel(currentDay)
  const weeks = getRoadmapWeeks(categoryId, completed)
  const maintenance = isMaintenanceDay(currentDay)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ '--glow': meta.color } as CSSProperties}
        className="relative z-10 flex max-h-[min(94dvh,820px)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[color-mix(in_oklab,var(--glow)_45%,transparent)] bg-card shadow-[0_0_60px_-12px_var(--glow)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--glow)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[var(--glow)] opacity-20 blur-3xl"
        />

        {/* Header */}
        <div className="relative shrink-0 border-b border-white/5 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--glow)]">
                {formatLevelHeadline(completed)}
              </p>
              <h2
                id={titleId}
                className="mt-1 text-xl font-semibold tracking-tight text-foreground uppercase sm:text-2xl"
              >
                {meta.title}
              </h2>
              <p className="mt-1.5 font-mono text-[11px] text-neon-yellow">
                {levelMeta.name}
                {maintenance ? ' · Modo libre' : ''}
              </p>
              <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                {maintenance
                  ? 'El hábito ya está creado. Valida tu foto diaria y sigue subiendo de nivel cada 7 días.'
                  : meta.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cerrar roadmap"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable roadmap */}
        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 scroll-smooth">
          <div className="flex flex-col gap-7">
            {weeks.map((week) => (
              <section key={week.key} aria-labelledby={`week-${week.key}`} className="flex flex-col gap-3">
                <div className="sticky top-0 z-[1] -mx-1 flex flex-col gap-0.5 bg-card/95 px-1 py-2 backdrop-blur-md">
                  <h3
                    id={`week-${week.key}`}
                    className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--glow)]"
                  >
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    {week.week}
                  </h3>
                  <p className="text-xs text-muted-foreground">{week.focus}</p>
                </div>

                <ul className="flex flex-col gap-2.5">
                  {week.challenges.map((challenge) => {
                    const status = getDayStatus(challenge.day, completed, currentDay)
                    return (
                      <RoadmapDayCard
                        key={challenge.day}
                        challenge={challenge}
                        status={status}
                        refProp={status === 'current' ? currentRef : undefined}
                        onCapture={
                          status === 'current'
                            ? () => {
                                onClose()
                                onCapture?.()
                              }
                            : undefined
                        }
                      />
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>

        {/* Progress footer — bloque de nivel actual */}
        <div className="relative shrink-0 border-t border-white/5 bg-card/95 px-5 py-4 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">
              Nivel {level} · {levelMeta.short}
            </span>
            <span className="font-mono text-[11px] text-[var(--glow)]">
              {completed} días · {dayInLevel}/{LEVEL_BLOCK_DAYS} del bloque
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/5"
            role="progressbar"
            aria-valuenow={blockProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso del nivel ${level}`}
          >
            <div
              className="h-full rounded-full bg-[var(--glow)] shadow-[0_0_10px_var(--glow)] transition-[width] duration-500"
              style={{ width: `${blockProgress}%` }}
            />
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: LEVEL_BLOCK_DAYS }, (_, i) => {
              const absoluteDay = (level - 1) * LEVEL_BLOCK_DAYS + (i + 1)
              const done = absoluteDay <= completed
              const current = absoluteDay === currentDay
              return (
                <span
                  key={absoluteDay}
                  title={`Día ${absoluteDay}`}
                  className={
                    done
                      ? 'h-1 flex-1 rounded-full bg-[var(--glow)]'
                      : current
                        ? 'h-1 flex-1 rounded-full bg-[var(--glow)]/45 ring-1 ring-[var(--glow)]'
                        : 'h-1 flex-1 rounded-full bg-white/10'
                  }
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

type DayStatus = 'done' | 'current' | 'locked'

function getDayStatus(day: number, completed: number, currentDay: number): DayStatus {
  if (day <= completed) return 'done'
  if (day === currentDay) return 'current'
  return 'locked'
}

function RoadmapDayCard({
  challenge,
  status,
  refProp,
  onCapture,
}: {
  challenge: DailyChallenge
  status: DayStatus
  refProp?: RefObject<HTMLLIElement | null>
  onCapture?: () => void
}) {
  return (
    <li
      ref={refProp}
      className={cn(
        'relative rounded-2xl border px-3.5 py-3 transition-all',
        status === 'done' &&
          'border-[color-mix(in_oklab,var(--glow)_35%,transparent)] bg-[color-mix(in_oklab,var(--glow)_8%,transparent)]',
        status === 'current' &&
          'border-[color-mix(in_oklab,var(--glow)_70%,transparent)] bg-[color-mix(in_oklab,var(--glow)_14%,transparent)] shadow-[0_0_28px_-8px_var(--glow)] ring-1 ring-[color-mix(in_oklab,var(--glow)_45%,transparent)]',
        status === 'locked' && 'border-white/10 bg-white/[0.02] opacity-55',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]',
            status === 'done' &&
              'border-[color-mix(in_oklab,var(--glow)_55%,transparent)] bg-[var(--glow)] text-background shadow-[0_0_16px_-2px_var(--glow)]',
            status === 'current' &&
              'border-[color-mix(in_oklab,var(--glow)_60%,transparent)] bg-[color-mix(in_oklab,var(--glow)_20%,transparent)] text-[var(--glow)] shadow-[0_0_18px_-4px_var(--glow)]',
            status === 'locked' && 'border-white/10 bg-background/40 text-muted-foreground',
          )}
          aria-hidden="true"
        >
          {status === 'done' ? (
            <Check className="size-3.5 stroke-[3]" />
          ) : status === 'locked' ? (
            <Lock className="size-3" />
          ) : (
            challenge.day
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Día {challenge.day}
            </p>
            {status === 'done' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--glow)_40%,transparent)] bg-[color-mix(in_oklab,var(--glow)_12%,transparent)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--glow)] shadow-[0_0_12px_-4px_var(--glow)]">
                Completado
              </span>
            ) : null}
            {status === 'current' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--glow)_50%,transparent)] bg-[color-mix(in_oklab,var(--glow)_18%,transparent)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--glow)] shadow-[0_0_14px_-3px_var(--glow)]">
                Hoy
              </span>
            ) : null}
          </div>
          <h4
            className={cn(
              'mt-1 text-sm font-semibold tracking-tight',
              status === 'locked' ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {challenge.title}
          </h4>
          <p
            className={cn(
              'mt-1 text-xs leading-relaxed',
              status === 'locked' ? 'text-muted-foreground/70' : 'text-muted-foreground',
            )}
          >
            {challenge.description}
          </p>

          {status === 'current' && onCapture ? (
            <button
              type="button"
              onClick={onCapture}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--glow)] px-4 text-sm font-semibold text-background shadow-[0_0_28px_-6px_var(--glow)] transition-all hover:scale-[1.01] sm:w-auto"
            >
              <Camera className="size-4" aria-hidden="true" />
              Validar con foto
            </button>
          ) : null}
        </div>
      </div>
    </li>
  )
}
