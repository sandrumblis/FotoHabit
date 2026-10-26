'use client'

import { useEffect, useId, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  Brain,
  CigaretteOff,
  Coins,
  Crown,
  Dumbbell,
  Flame,
  Lock,
  Moon,
  Palette,
  Play,
  Salad,
  Sparkles,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useHabitProgress, isProCategory } from './habit-progress-context'
import { useKorePro } from './kore-pro-context'
import {
  getCategoryMeta,
  getChallenge,
  HABIT_CHALLENGE_DAYS,
  PHASE_META,
  type HabitCategoryId,
} from '@/lib/habit-challenges'
import { FREE_ACTIVE_OBJECTIVES_LIMIT } from '@/lib/kore-pro'
import {
  getCurrentLevel,
  getLevelBlockDays,
  isMaintenanceDay,
} from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

const CATALOG: Array<{
  id: HabitCategoryId
  icon: LucideIcon
  emoji: string
  short: string
}> = [
  { id: 'actividad-fisica', icon: Dumbbell, emoji: '🏋️‍♂️', short: 'Actividad Física' },
  { id: 'comida-saludable', icon: Salad, emoji: '🥗', short: 'Comida Saludable' },
  { id: 'enfoque-mente', icon: Brain, emoji: '📚', short: 'Enfoque y Mente' },
  { id: 'orden-limpieza', icon: Sparkles, emoji: '✨', short: 'Orden y Limpieza' },
  { id: 'sueno-descanso', icon: Moon, emoji: '🌙', short: 'Sueño y Descanso' },
  { id: 'ahorro-finanzas', icon: Coins, emoji: '💰', short: 'Ahorro y Finanzas' },
  { id: 'sin-humos', icon: CigaretteOff, emoji: '🚭', short: 'Sin Humos' },
]

type ExploreObjectivesModalProps = {
  open: boolean
  onClose: () => void
  onUnlockPro: (
    title: string,
    description: string,
    reason?: 'limit' | 'feature' | 'category',
  ) => void
  /** Abre el Roadmap (desafíos diarios + Validar con foto). */
  onSelectObjective: (categoryId: HabitCategoryId) => void
}

function ProBadge() {
  return (
    <span
      className="pointer-events-none absolute -right-1.5 -top-1.5 z-[1] inline-flex items-center gap-0.5 rounded-full border border-neon-yellow/60 bg-background/95 px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-wider text-neon-yellow shadow-[0_0_12px_-3px_var(--color-neon-yellow)]"
      aria-hidden="true"
    >
      <Lock className="size-2" aria-hidden="true" />
      PRO
    </span>
  )
}

function CatalogObjectiveCard({
  id,
  icon: Icon,
  emoji,
  short,
  onClick,
}: {
  id: HabitCategoryId
  icon: LucideIcon
  emoji: string
  short: string
  onClick: () => void
}) {
  const { isActive, getCompleted, isTodayValidated } = useHabitProgress()
  const meta = getCategoryMeta(id)
  const color = meta.color
  const { isPro } = useKorePro()
  const pro = isProCategory(id) && !isPro
  const active = isActive(id)
  const completed = getCompleted(id)
  const doneToday = active && isTodayValidated(id)
  const level = getCurrentLevel(completed)
  const block = getLevelBlockDays(completed)
  const inFirstCycle = completed < HABIT_CHALLENGE_DAYS
  const maintenance = isMaintenanceDay(completed + 1)

  const progressLabel = maintenance
    ? `Nivel ${level} · ${block.done}/${block.total} días`
    : inFirstCycle
      ? `Día ${completed}/${HABIT_CHALLENGE_DAYS}`
      : `Nivel ${level} · ${block.done}/${block.total} días`

  const glowStyle = {
    '--glow': color,
    borderColor: active
      ? `color-mix(in oklab, ${color} ${doneToday ? 70 : 55}%, transparent)`
      : pro
        ? `color-mix(in oklab, ${color} 40%, transparent)`
        : 'rgba(255,255,255,0.1)',
    background: active
      ? `color-mix(in oklab, ${color} ${doneToday ? 10 : 8}%, transparent)`
      : pro
        ? `color-mix(in oklab, ${color} 6%, transparent)`
        : 'color-mix(in oklab, var(--color-background) 40%, transparent)',
    boxShadow: active
      ? doneToday
        ? undefined
        : `0 0 22px -8px ${color}`
      : undefined,
  } as CSSProperties

  return (
    <button
      type="button"
      onClick={onClick}
      style={glowStyle}
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300',
        active && doneToday && 'animate-neon-border',
        !pro && !active && 'hover:brightness-110',
      )}
    >
      <span className="relative flex w-full items-center gap-3 px-3.5 pt-3 pb-2.5">
        <span
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full border"
          style={{
            color,
            borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
            boxShadow: active
              ? `0 0 16px -4px ${color}`
              : `0 0 10px -6px ${color}`,
            background: `color-mix(in oklab, ${color} 12%, transparent)`,
          }}
        >
          <Icon
            className="size-4 [filter:drop-shadow(0_0_6px_var(--glow))]"
            aria-hidden="true"
          />
          {pro ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-neon-yellow text-background shadow-[0_0_10px_-2px_var(--color-neon-yellow)]">
              <Lock className="size-2.5" aria-hidden="true" />
            </span>
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              <span aria-hidden="true">{emoji} </span>
              {short}
            </span>
            {pro ? (
              <span
                className="rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider"
                style={{
                  color,
                  borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
                  background: `color-mix(in oklab, ${color} 12%, transparent)`,
                }}
              >
                PRO
              </span>
            ) : null}
            {active ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider"
                style={{
                  color,
                  borderColor: `color-mix(in oklab, ${color} 50%, transparent)`,
                  background: `color-mix(in oklab, ${color} 12%, transparent)`,
                }}
              >
                <span
                  className="animate-neon-glow size-1.5 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                  aria-hidden="true"
                />
                {doneToday ? 'En curso' : 'Activo'}
                {doneToday ? (
                  <Flame
                    className="size-2.5 fill-current drop-shadow-[0_0_6px_var(--glow)]"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {meta.description}
          </span>
          {active ? (
            <span
              className="mt-1 block font-mono text-[10px] tabular-nums tracking-tight"
              style={{ color }}
            >
              {progressLabel}
              {doneToday ? ' · 🔥 Hoy' : ''}
            </span>
          ) : null}
        </span>

        {pro ? (
          <Crown className="size-4 shrink-0 text-neon-yellow" aria-hidden="true" />
        ) : (
          <span
            className="shrink-0 font-mono text-[10px] uppercase tracking-wider"
            style={{ color }}
          >
            Ver
          </span>
        )}
      </span>

      {active ? (
        <span className="relative mx-3.5 mb-3 block h-2 overflow-hidden rounded-full bg-white/8">
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.max(block.percent, block.done > 0 ? 6 : 0)}%`,
              background: `linear-gradient(90deg, color-mix(in oklab, ${color} 75%, white), ${color})`,
              boxShadow: `0 0 12px ${color}, 0 0 4px ${color}`,
            }}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-end px-1.5">
            <span className="font-mono text-[8px] font-semibold text-white/70 drop-shadow">
              {block.done}/{block.total}
            </span>
          </span>
        </span>
      ) : null}
    </button>
  )
}

function ObjectivePreview({
  id,
  emoji,
  Icon,
  onBack,
  onStarted,
  onOpenRoadmap,
  onUnlockPro,
}: {
  id: HabitCategoryId
  emoji: string
  Icon: LucideIcon
  onBack: () => void
  onStarted: () => void
  onOpenRoadmap: () => void
  onUnlockPro: ExploreObjectivesModalProps['onUnlockPro']
}) {
  const {
    isActive,
    activateCategory,
    deactivateCategory,
    activeCategoryIds,
    freeActiveLimit,
    getCompleted,
  } = useHabitProgress()
  const { isPro } = useKorePro()
  const meta = getCategoryMeta(id)
  const color = meta.color
  const active = isActive(id)
  const completed = getCompleted(id)
  const sampleDay = getChallenge(id, Math.max(completed + 1, 1))
  const proLocked = isProCategory(id) && !isPro
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  function handleStart() {
    setActionError(null)
    if (proLocked) {
      onUnlockPro(
        meta.title,
        'Este objetivo forma parte de FotoHabit PRO. Desbloquéalo con una suscripción.',
        'category',
      )
      return
    }
    const result = activateCategory(id, { isPro })
    if (!result.ok) {
      if (result.reason === 'limit') {
        onUnlockPro(
          'Objetivos ilimitados',
          `Ya tienes ${activeCategoryIds.length} de ${freeActiveLimit} objetivos activos en el plan gratuito. Pasa a FotoHabit PRO para gestionar todos a la vez.`,
          'limit',
        )
        return
      }
      onUnlockPro(meta.title, meta.description, 'category')
      return
    }
    onStarted()
  }

  function handleRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true)
      return
    }
    deactivateCategory(id)
    setConfirmRemove(false)
    onBack()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-neon-cyan"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Volver al catálogo
        </button>

        <div
          className="rounded-3xl border p-5"
          style={{
            borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
            background: `color-mix(in oklab, ${color} 8%, transparent)`,
            boxShadow: `0 0 40px -16px ${color}`,
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-full border text-lg"
              style={{
                color,
                borderColor: `color-mix(in oklab, ${color} 50%, transparent)`,
                background: `color-mix(in oklab, ${color} 14%, transparent)`,
              }}
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color }}>
                Vista previa
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                <span aria-hidden="true">{emoji} </span>
                {meta.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {meta.description}
              </p>
              {active ? (
                <p className="mt-2 font-mono text-[11px]" style={{ color }}>
                  Activo · {completed} días completados
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Cotillear no lo añade a tus activos. Pulsa «Empezar» cuando quieras.
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Ciclo de 21 días
          </p>
          <ul className="grid gap-2 sm:grid-cols-3">
            {(
              Object.entries(PHASE_META) as Array<
                [keyof typeof PHASE_META, (typeof PHASE_META)[keyof typeof PHASE_META]]
              >
            ).map(([key, phase]) => (
              <li
                key={key}
                className="rounded-2xl border border-white/10 bg-card/50 px-3 py-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
                  {phase.label}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{phase.week}</p>
                <p className="mt-1 text-xs text-foreground/90">{phase.focus}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-2xl border border-white/10 bg-card/40 px-4 py-4"
          aria-label="Ejemplo de reto"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Ejemplo · Día {sampleDay.day}
          </p>
          <h3 className="mt-1.5 text-base font-semibold text-foreground">{sampleDay.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {sampleDay.description}
          </p>
          {sampleDay.tip ? (
            <p className="mt-2 text-xs text-muted-foreground/90">
              Tip: {sampleDay.tip}
            </p>
          ) : null}
        </section>

        {actionError ? (
          <p className="text-sm text-red-300" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-white/5 bg-background/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          {active ? (
            <>
              <button
                type="button"
                onClick={onOpenRoadmap}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-background transition-transform hover:scale-[1.01]"
                style={{
                  background: color,
                  boxShadow: `0 0 28px -6px ${color}`,
                }}
              >
                <Play className="size-4 fill-current" aria-hidden="true" />
                Abrir roadmap
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors',
                  confirmRemove
                    ? 'border-red-400/50 bg-red-500/15 text-red-300'
                    : 'border-white/15 bg-white/5 text-muted-foreground hover:border-red-400/40 hover:text-red-300',
                )}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {confirmRemove
                  ? 'Confirmar: quitar de mis objetivos'
                  : 'Quitar de mis objetivos'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-background transition-transform hover:scale-[1.01]"
              style={{
                background: color,
                boxShadow: `0 0 28px -6px ${color}`,
              }}
            >
              {proLocked ? (
                <>
                  <Lock className="size-4" aria-hidden="true" />
                  Desbloquear con PRO
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" aria-hidden="true" />
                  Empezar este objetivo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ExploreObjectivesModal({
  open,
  onClose,
  onUnlockPro,
  onSelectObjective,
}: ExploreObjectivesModalProps) {
  const titleId = useId()
  const { activeCategoryIds, freeActiveLimit } = useHabitProgress()
  const { isPro } = useKorePro()
  const [previewId, setPreviewId] = useState<HabitCategoryId | null>(null)

  useEffect(() => {
    if (!open) {
      setPreviewId(null)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewId) setPreviewId(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, previewId])

  if (!open) return null

  function openProFeature(
    title: string,
    description: string,
    reason: 'limit' | 'feature' | 'category' = 'feature',
  ) {
    onClose()
    onUnlockPro(title, description, reason)
  }

  function handleCatalogClick(id: HabitCategoryId) {
    // Solo vista previa: nunca activar aquí.
    setPreviewId(id)
  }

  const previewItem = previewId
    ? CATALOG.find((c) => c.id === previewId) ?? null
    : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[70] flex flex-col bg-background animate-in fade-in duration-300"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 top-20 size-72 rounded-full bg-neon-cyan/10 blur-3xl" />
        <div className="absolute -right-20 bottom-24 size-80 rounded-full bg-neon-fuchsia/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />
      </div>

      <header className="relative z-10 shrink-0 border-b border-white/5 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-start gap-3">
          <button
            type="button"
            onClick={() => {
              if (previewId) setPreviewId(null)
              else onClose()
            }}
            className={cn(
              'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
              'border border-white/10 bg-card/60 text-foreground backdrop-blur-md',
              'transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
            )}
            aria-label={previewId ? 'Volver al catálogo' : 'Volver a Home'}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
              Explorar y crear
            </p>
            <h1
              id={titleId}
              className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              {previewId ? 'Detalle del objetivo' : 'Añade objetivos'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {previewId
                ? 'Revisa el reto y decide si quieres empezarlo.'
                : activeCategoryIds.length === 0
                  ? 'Explora el catálogo y elige con «Empezar este objetivo».'
                  : isPro
                    ? 'PRO activo · objetivos ilimitados'
                    : `Gratis · hasta ${FREE_ACTIVE_OBJECTIVES_LIMIT} activos (${activeCategoryIds.length}/${freeActiveLimit})`}
            </p>
          </div>
        </div>
      </header>

      {previewItem && previewId ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <ObjectivePreview
            id={previewId}
            emoji={previewItem.emoji}
            Icon={previewItem.icon}
            onBack={() => setPreviewId(null)}
            onStarted={() => {
              setPreviewId(null)
              onClose()
              onSelectObjective(previewId)
            }}
            onOpenRoadmap={() => {
              setPreviewId(null)
              onClose()
              onSelectObjective(previewId)
            }}
            onUnlockPro={(title, description, reason) => {
              setPreviewId(null)
              openProFeature(title, description, reason)
            }}
          />
        </div>
      ) : (
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 sm:gap-10">
            <section className="flex flex-col gap-3" aria-label="Acciones PRO">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Crear
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={() =>
                    openProFeature(
                      'Crea un objetivo',
                      'Diseña hábitos personalizados con FotoHabit PRO.',
                      'feature',
                    )
                  }
                  className="relative inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-neon-fuchsia/45 bg-neon-fuchsia/10 px-4 py-3 text-sm font-semibold leading-snug whitespace-normal text-neon-fuchsia shadow-[0_0_24px_-8px_var(--color-neon-fuchsia)] transition-transform hover:scale-[1.01]"
                >
                  <ProBadge />
                  <Palette className="size-4 shrink-0" aria-hidden="true" />
                  <span className="text-center">Crea un objetivo</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openProFeature(
                      'Retos en grupo con amigos',
                      'Invita a amigos y compartid rachas con FotoHabit PRO.',
                      'feature',
                    )
                  }
                  className="relative inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-neon-cyan/45 bg-neon-cyan/10 px-4 py-3 text-sm font-semibold leading-snug whitespace-normal text-neon-cyan shadow-[0_0_24px_-8px_var(--color-neon-cyan)] transition-transform hover:scale-[1.01]"
                >
                  <ProBadge />
                  <Users className="size-4 shrink-0" aria-hidden="true" />
                  <span className="text-center">Crea un reto con amigos</span>
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-4" aria-label="Catálogo de objetivos">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Catálogo de objetivos
              </p>
              <ul className="flex flex-col gap-3 sm:gap-3.5">
                {CATALOG.map((item) => (
                  <li key={item.id}>
                    <CatalogObjectiveCard
                      id={item.id}
                      icon={item.icon}
                      emoji={item.emoji}
                      short={item.short}
                      onClick={() => handleCatalogClick(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
