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
    // No capturar el pointer sobre botones: deja que onClick funcione
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
    el.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag.active) return
    const el = scrollerRef.current
    if (!el) return
    const dx = e.clientX - drag.startX
    if (Math.abs(dx) > 6) drag.moved = true
    el.scrollLeft = drag.startScroll - dx
    updateEdges()
  }

  function endDrag() {
    const drag = dragRef.current
    if (!drag.active) return
    const el = scrollerRef.current
    if (el && drag.pointerId != null) {
      try {
        el.releasePointerCapture(drag.pointerId)
      } catch {
        /* noop */
      }
    }
    // Reset moved en el siguiente tick para no bloquear clicks
    const wasMoved = drag.moved
    dragRef.current = { active: false, startX: 0, startScroll: 0, moved: wasMoved, pointerId: null }
    window.setTimeout(() => {
      dragRef.current.moved = false
    }, 0)
  }

  function guardClick(fn: () => void) {
    if (dragRef.current.moved) return
    fn()
  }

  return (
    <section aria-label="Objetivos activos" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <button
            type="button"
            onClick={onAddGoalClick}
            aria-label="Explorar y añadir objetivos"
            className={cn(
              'font-mono text-[10px] uppercase tracking-[0.2em] text-neon-cyan',
              'cursor-pointer rounded-sm transition-all duration-200',
              'hover:text-neon-cyan/90 hover:underline hover:underline-offset-4 hover:decoration-neon-cyan/50',
              'hover:[text-shadow:0_0_12px_var(--color-neon-cyan)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            Objetivos
          </button>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {activeObjectives.length === 0
              ? 'Añade tu primer objetivo'
              : 'Tus objetivos activos'}
          </h2>
        </div>
        {canScrollRight ? (
          <p className="font-mono text-[9px] uppercase tracking-wider text-neon-cyan/70">
            Desliza →
          </p>
        ) : null}
      </div>

      <div className="relative w-full max-w-full">
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-[2] w-8 bg-gradient-to-r from-background via-background/70 to-transparent transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-[2] w-12 bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity duration-300',
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
          {/* py extra: hueco para el glow neón (overflow-x recorta el eje Y en CSS) */}
          <ul className="flex w-max gap-4 py-4 pl-2 pr-8 sm:gap-5 sm:pr-10">
            {activeObjectives.map((obj) => {
              const meta = getCategoryMeta(obj.id)
              const completed = getCompleted(obj.id)
              const doneToday = isTodayValidated(obj.id)
              const level = getCurrentLevel(completed)
              const block = getLevelBlockDays(completed)
              const Icon = obj.icon
              const inFirstCycle = completed < HABIT_CHALLENGE_DAYS

              return (
                <li
                  key={obj.id}
                  className="flex w-[88px] shrink-0 snap-start flex-col items-center gap-2 overflow-visible sm:w-[96px]"
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
                      size={80}
                      strokeWidth={3.5}
                    >
                      <span
                        className={cn(
                          'flex size-full items-center justify-center rounded-full border bg-card',
                          doneToday
                            ? 'border-neon-yellow/35 bg-neon-yellow/10'
                            : 'border-white/10',
                        )}
                        style={{ '--glow': meta.color } as CSSProperties}
                      >
                        {doneToday ? (
                          <Flame
                            className="size-6 fill-neon-yellow text-neon-yellow drop-shadow-[0_0_10px_var(--color-neon-yellow)] sm:size-7"
                            aria-hidden="true"
                          />
                        ) : (
                          <Icon
                            className="size-6 text-[var(--glow)] [filter:drop-shadow(0_0_8px_var(--glow))] sm:size-7"
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

                  <div className="flex flex-col items-center gap-0.5 text-center">
                    <span className="line-clamp-1 text-[11px] font-medium leading-tight text-foreground">
                      <span aria-hidden="true">{obj.emoji} </span>
                      {obj.short}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Nv.{level}
                      {doneToday ? ' · 🔥' : ''}
                    </span>
                    <span
                      className="font-mono text-[10px] tabular-nums tracking-tight"
                      style={{ color: meta.color } as CSSProperties}
                    >
                      {block.done}/{block.total} días
                    </span>
                    {inFirstCycle ? (
                      <span className="font-mono text-[9px] text-white/40">
                        {completed}/{HABIT_CHALLENGE_DAYS} días
                      </span>
                    ) : null}
                  </div>
                </li>
              )
            })}

            <li className="flex w-[88px] shrink-0 snap-start flex-col items-center gap-2 overflow-visible sm:w-[96px]">
              <button
                type="button"
                onPointerDown={(e) => {
                  // Evita que el carrusel capture el pointer y se trague el click
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onAddGoalClick()
                }}
                aria-label="Añadir o crear objetivos"
                className={cn(
                  'group relative z-[3] flex size-20 items-center justify-center overflow-visible rounded-full',
                  'border border-dashed border-neon-cyan/55 bg-neon-cyan/5',
                  'shadow-[0_0_28px_-6px_var(--color-neon-cyan)]',
                  'transition-all duration-300 hover:scale-[1.04] hover:border-neon-cyan hover:bg-neon-cyan/10',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <Plus
                  className="size-8 text-neon-cyan drop-shadow-[0_0_10px_var(--color-neon-cyan)] transition-transform group-hover:rotate-90"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddGoalClick()
                }}
                className="flex flex-col items-center gap-0.5 text-center focus-visible:outline-none"
              >
                <span className="text-[11px] font-medium text-foreground">Añadir</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-neon-cyan">
                  + Explorar
                </span>
              </button>
            </li>

            <li aria-hidden="true" className="w-6 shrink-0 snap-end sm:w-8" />
          </ul>
        </div>
      </div>
    </section>
  )
}
