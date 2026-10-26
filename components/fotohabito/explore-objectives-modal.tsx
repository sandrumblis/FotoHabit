'use client'

import { useEffect, useId, type CSSProperties } from 'react'
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
  Salad,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useHabitProgress, isProCategory } from './habit-progress-context'
import { useKorePro } from './kore-pro-context'
import {
  getCategoryMeta,
  HABIT_CHALLENGE_DAYS,
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
        ) : active ? (
          <span
            className="animate-neon-glow size-2.5 shrink-0 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 10px ${color}, 0 0 18px color-mix(in oklab, ${color} 60%, transparent)`,
            }}
            aria-hidden="true"
          />
        ) : (
          <span
            className="shrink-0 font-mono text-[10px] uppercase tracking-wider"
            style={{ color }}
          >
            Ver
          </span>
        )}
      </span>

      {/* Barra de progreso del ciclo actual (objetivos activos) */}
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

export function ExploreObjectivesModal({
  open,
  onClose,
  onUnlockPro,
  onSelectObjective,
}: ExploreObjectivesModalProps) {
  const titleId = useId()
  const { isActive, activateCategory, activeCategoryIds, freeActiveLimit } =
    useHabitProgress()
  const { isPro } = useKorePro()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  function openProFeature(
    title: string,
    description: string,
    reason: 'limit' | 'feature' | 'category' = 'feature',
  ) {
    onClose()
    onUnlockPro(title, description, reason)
  }

  function handleObjectiveClick(id: HabitCategoryId) {
    const meta = getCategoryMeta(id)

    if (isProCategory(id) && !isPro) {
      openProFeature(
        meta.title,
        'Este objetivo forma parte de FotoHabit PRO. Desbloquéalo con una suscripción.',
        'category',
      )
      return
    }

    if (isActive(id)) {
      onClose()
      onSelectObjective(id)
      return
    }

    const result = activateCategory(id, { isPro })
    if (!result.ok) {
      if (result.reason === 'limit') {
        openProFeature(
          'Objetivos ilimitados',
          `Ya tienes ${activeCategoryIds.length} de ${freeActiveLimit} objetivos activos en el plan gratuito. Pasa a FotoHabit PRO para gestionar todos a la vez.`,
          'limit',
        )
        return
      }
      openProFeature(meta.title, meta.description, 'category')
      return
    }

    onClose()
    onSelectObjective(id)
  }

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
            onClick={onClose}
            className={cn(
              'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
              'border border-white/10 bg-card/60 text-foreground backdrop-blur-md',
              'transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
            )}
            aria-label="Volver a Home"
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
              Añade objetivos
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isPro
                ? 'PRO activo · objetivos ilimitados'
                : `Gratis · hasta ${FREE_ACTIVE_OBJECTIVES_LIMIT} activos (${activeCategoryIds.length}/${freeActiveLimit})`}
            </p>
          </div>
        </div>
      </header>

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
                    onClick={() => handleObjectiveClick(item.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
