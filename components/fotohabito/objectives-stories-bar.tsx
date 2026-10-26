'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  Brain,
  Check,
  CigaretteOff,
  Coins,
  Dumbbell,
  Flame,
  Moon,
  Plus,
  Salad,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useHabitProgress } from './habit-progress-context'
import { NeonProgressRing } from './neon-progress-ring'
import {
  getCategoryMeta,
  HABIT_CHALLENGE_DAYS,
  type HabitCategoryId,
} from '@/lib/habit-challenges'
import { getCurrentLevel, getLevelBlockDays } from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

const OBJECTIVE_META: Record<
  HabitCategoryId,
  { icon: LucideIcon; emoji: string; short: string }
> = {
  'actividad-fisica': { icon: Dumbbell, emoji: '🏋️‍♂️', short: 'Actividad' },
  'comida-saludable': { icon: Salad, emoji: '🥗', short: 'Comida' },
  'enfoque-mente': { icon: Brain, emoji: '📚', short: 'Mente' },
  'orden-limpieza': { icon: Sparkles, emoji: '✨', short: 'Orden' },
  'sueno-descanso': { icon: Moon, emoji: '🌙', short: 'Sueño' },
  'ahorro-finanzas': { icon: Coins, emoji: '💰', short: 'Ahorro' },
  'sin-humos': { icon: CigaretteOff, emoji: '🚭', short: 'Sin humos' },
}

type ObjectivesStoriesBarProps = {
  onSelect: (categoryId: HabitCategoryId) => void
  onAddGoalClick: () => void
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('button, a, [role="button"]'))
}

export function ObjectivesStoriesBar({ onSelect, onAddGoalClick }: ObjectivesStoriesBarProps) {
  const { getCompleted, isTodayValidated, activeCategoryIds } = useHabitProgress()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    active: boolean
    startX: number
    startScroll: number
    moved: boolean
    pointerId: number | null
  }>({ active: false, startX: 0, startScroll: 0, moved: false, pointerId: null })

  const [canScrollRight, setCanScrollRight] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)

  const activeObjectives = useMemo(
    () =>
      activeCategoryIds
        .map((id) => ({ id, ...OBJECTIVE_META[id] }))
        .filter((o) => o.icon),
    [activeCategoryIds],
  )

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const left = el.scrollLeft
    setCanScrollLeft(left > 4)
    setCanScrollRight(max > 4 && left < max - 4)
  }, [])

  useEffect(() => {
    updateEdges()
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => updateEdges()
    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(() => updateEdges())
    ro.observe(el)

    const onWheel = (e: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return
      e.preventDefault()
      el.scrollLeft += delta
      updateEdges()
    }
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onWheel)
      ro.disconnect()
    }
  }, [updateEdges, activeObjectives.length])

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (isInteractiveTarget(e.target)) return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag.active) return
    const el = scrollerRef.current
    if (!el) return
    const dx = e.clientX - drag.startX
    if (Math.abs(dx) > 6) drag.moved = true
    el.scrollLeft = drag.startScroll - dx
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag.active) return
    drag.active = false
    const el = scrollerRef.current
    if (el && drag.pointerId != null) {
      try {
        el.releasePointerCapture(drag.pointerId)
      } catch {
        /* ignore */
      }
    }
    window.setTimeout(() => {
      drag.moved = false
    }, 0)
  }

  function guardClick(fn: () => void) {
    if (dragRef.current.moved) return
    fn()
  }

  return (
    <section
      aria-label="Objetivos activos"
      className="rounded-3xl border border-white/8 bg-card/40 px-4 py-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:px-5 sm:py-6"
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan/80">
            Comunidad
          </p>
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {activeObjectives.length === 0
              ? 'Empieza con un objetivo'
              : 'Objetivos activos'}
          </h2>
          <p className="max-w-[18rem] text-pretty text-xs leading-relaxed text-muted-foreground sm:max-w-sm">
            {activeObjectives.length === 0
              ? 'Elige un hábito y valida una foto al día para subir de nivel.'
              : 'Toca un anillo para abrir el reto de hoy.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddGoalClick}
          className={cn(
            'shrink-0 rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3.5 py-2',
            'font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan',
            'transition hover:border-neon-cyan/60 hover:bg-neon-cyan/15',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          + Añadir
        </button>
      </header>

      <div className="relative w-full max-w-full">
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-[2] w-6 rounded-l-2xl bg-gradient-to-r from-card/90 to-transparent transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-[2] w-10 rounded-r-2xl bg-gradient-to-l from-card/95 to-transparent transition-opacity duration-300',
            canScrollRight ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div
          ref={scrollerRef}
          role="region"
          aria-label="Carrusel de objetivos activos"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            'flex w-full touch-pan-x overflow-x-auto overflow-y-visible overscroll-x-contain',
            'scroll-smooth snap-x snap-mandatory',
            'cursor-grab active:cursor-grabbing',
            'select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <ul className="flex w-max items-start gap-5 px-1 py-3 sm:gap-6 sm:px-2 sm:py-4">
            {activeObjectives.map((obj) => {
              const meta = getCategoryMeta(obj.id)
              const completed = getCompleted(obj.id)
              const doneToday = isTodayValidated(obj.id)
              const level = getCurrentLevel(completed)
              const block = getLevelBlockDays(completed)
              const Icon = obj.icon
              const progressLabel = inFirstCycleLabel(completed)

              return (
                <li
                  key={obj.id}
                  className="flex w-[92px] shrink-0 snap-start flex-col items-center gap-3 overflow-visible sm:w-[100px]"
                >
                  <button
                    type="button"
                    onClick={() => guardClick(() => onSelect(obj.id))}
                    aria-label={`${meta.title}. Nivel ${level}. ${doneToday ? 'Completado hoy' : 'Pendiente'}`}
                    className={cn(
                      'group relative overflow-visible rounded-full transition-transform duration-300 hover:scale-[1.04]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    )}
                  >
                    <NeonProgressRing
                      progress={block.ratio}
                      color={meta.color}
                      size={84}
                      strokeWidth={3.25}
                    >
                      <span
                        className={cn(
                          'flex size-full items-center justify-center rounded-full border bg-background/90',
                          doneToday
                            ? 'border-neon-yellow/40 bg-neon-yellow/10'
                            : 'border-white/10',
                        )}
                        style={{ '--glow': meta.color } as CSSProperties}
                      >
                        {doneToday ? (
                          <Flame
                            className="size-7 fill-neon-yellow text-neon-yellow drop-shadow-[0_0_10px_var(--color-neon-yellow)]"
                            aria-hidden="true"
                          />
                        ) : (
                          <Icon
                            className="size-7 text-[var(--glow)] [filter:drop-shadow(0_0_8px_var(--glow))]"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </NeonProgressRing>

                    {doneToday ? (
                      <span className="absolute -bottom-0.5 -right-0.5 z-[2] flex size-5 items-center justify-center rounded-full border border-background bg-neon-lime text-background shadow-[0_0_12px_-2px_var(--color-neon-lime)]">
                        <Check className="size-3 stroke-[3]" aria-hidden="true" />
                      </span>
                    ) : null}
                  </button>

                  <div className="flex w-full flex-col items-center gap-1 text-center">
                    <span className="line-clamp-1 text-[12px] font-semibold leading-tight text-foreground">
                      {obj.short}
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Nv.{level}
                      {doneToday ? ' · hoy' : ''}
                    </span>
                    <span
                      className="font-mono text-[10px] tabular-nums tracking-tight text-muted-foreground"
                      style={{ color: meta.color } as CSSProperties}
                    >
                      {progressLabel}
                    </span>
                  </div>
                </li>
              )
            })}

            <li className="flex w-[92px] shrink-0 snap-start flex-col items-center gap-3 overflow-visible sm:w-[100px]">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onAddGoalClick()
                }}
                aria-label="Añadir o crear objetivos"
                className={cn(
                  'group relative z-[3] flex size-[84px] items-center justify-center overflow-visible rounded-full',
                  'border border-dashed border-neon-cyan/45 bg-neon-cyan/[0.06]',
                  'transition-all duration-300 hover:scale-[1.04] hover:border-neon-cyan/70 hover:bg-neon-cyan/10',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <Plus
                  className="size-8 text-neon-cyan/90 transition-transform group-hover:rotate-90"
                  aria-hidden="true"
                />
              </button>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[12px] font-semibold text-foreground">Añadir</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-neon-cyan/80">
                  Explorar
                </span>
              </div>
            </li>

            <li aria-hidden="true" className="w-4 shrink-0 snap-end sm:w-6" />
          </ul>
        </div>
      </div>
    </section>
  )
}

function inFirstCycleLabel(completed: number) {
  if (completed < HABIT_CHALLENGE_DAYS) {
    return `${completed}/${HABIT_CHALLENGE_DAYS}`
  }
  const block = getLevelBlockDays(completed)
  return `${block.done}/${block.total}`
}
