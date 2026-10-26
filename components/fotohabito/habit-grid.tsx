'use client'

import { useState } from 'react'
import {
  Brain,
  CigaretteOff,
  Coins,
  Crown,
  Dumbbell,
  Moon,
  Salad,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { HabitCard, type Habit } from './habit-card'
import { HabitChallengeModal } from './habit-challenge-modal'
import {
  HabitCelebrationModal,
  type CelebrationKind,
} from './habit-celebration-modal'
import {
  CaptureModal,
  type CaptureChallengeContext,
  type CaptureResult,
} from './capture-modal'
import { useHabitProgress } from './habit-progress-context'
import {
  getCategoryMeta,
  getChallenge,
  getCurrentDay,
  type HabitCategoryId,
} from '@/lib/habit-challenges'
import {
  getLevelForDay,
  getLevelMeta,
  isHabitCreatedMilestone,
  isLevelMilestoneDay,
  isMaintenanceDay,
} from '@/lib/habit-levels'

const freeHabitDefs: Omit<Habit, 'completed'>[] = [
  {
    id: 'actividad-fisica',
    title: 'Actividad Física',
    subtitle: 'Niveles infinitos',
    icon: Dumbbell,
    color: 'var(--color-neon-cyan)',
  },
  {
    id: 'orden-limpieza',
    title: 'Orden y Limpieza',
    subtitle: 'Niveles infinitos',
    icon: Sparkles,
    color: 'var(--color-neon-yellow)',
  },
  {
    id: 'comida-saludable',
    title: 'Comida Saludable y Equilibrada',
    subtitle: 'Niveles infinitos',
    icon: Salad,
    color: 'var(--color-neon-lime)',
  },
  {
    id: 'enfoque-mente',
    title: 'Enfoque y Mente',
    subtitle: 'Niveles infinitos',
    icon: Brain,
    color: 'var(--color-neon-fuchsia)',
  },
]

const proHabits: Habit[] = [
  {
    id: 'sueno-descanso',
    title: 'Sueño y Descanso',
    subtitle: 'Niveles infinitos',
    icon: Moon,
    locked: true,
  },
  {
    id: 'ahorro-finanzas',
    title: 'Ahorro y Finanzas',
    subtitle: 'Niveles infinitos',
    icon: Coins,
    locked: true,
  },
  {
    id: 'sin-humos',
    title: 'Sin Humos',
    subtitle: 'Niveles infinitos',
    icon: CigaretteOff,
    locked: true,
  },
  { title: 'Reto Personalizado', subtitle: 'Crea tu propio reto', icon: WandSparkles, locked: true },
]

type CelebrationState = {
  kind: CelebrationKind
  level: number
  day: number
  categoryId: HabitCategoryId
}

export function HabitGrid() {
  const {
    getCompleted,
    completeDay,
    canValidateToday,
    dailyValidationMessage,
  } = useHabitProgress()
  const [active, setActive] = useState<{
    categoryId: HabitCategoryId
  } | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureChallenge, setCaptureChallenge] = useState<CaptureChallengeContext | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)

  const freeHabits: Habit[] = freeHabitDefs.map((habit) => ({
    ...habit,
    completed: habit.id ? getCompleted(habit.id) : 0,
  }))

  function openCaptureForCategory(categoryId: HabitCategoryId) {
    if (!canValidateToday()) {
      setSuccessMessage(dailyValidationMessage)
      window.setTimeout(() => setSuccessMessage(null), 5600)
      return
    }
    const completed = getCompleted(categoryId)
    const day = getCurrentDay(completed)
    const challenge = getChallenge(categoryId, day)
    const categoryMeta = getCategoryMeta(categoryId)
    setCaptureChallenge({
      title: challenge.title,
      description: challenge.description,
      day: challenge.day,
      categoryId,
      objective: categoryMeta.title,
      maintenance: isMaintenanceDay(day),
    })
    setCaptureOpen(true)
  }

  function handleValidated(result: CaptureResult) {
    if (!result.valid || !result.categoryId) return
    const categoryId = result.categoryId as HabitCategoryId
    const completion = completeDay(categoryId)
    if (!completion.ok) {
      setSuccessMessage(completion.message)
      setCaptureChallenge(null)
      window.setTimeout(() => setSuccessMessage(null), 5600)
      return
    }
    const next = completion.next
    setSuccessMessage(result.message)
    setCaptureChallenge(null)

    if (isHabitCreatedMilestone(next)) {
      setCelebration({
        kind: 'habit-created',
        level: getLevelForDay(next),
        day: next,
        categoryId,
      })
    } else if (isLevelMilestoneDay(next)) {
      setCelebration({
        kind: 'level-up',
        level: getLevelForDay(next),
        day: next,
        categoryId,
      })
    } else {
      setActive({ categoryId })
    }

    window.setTimeout(() => setSuccessMessage(null), 5200)
  }

  function closeCelebration() {
    const cat = celebration?.categoryId
    setCelebration(null)
    if (cat) setActive({ categoryId: cat })
  }

  return (
    <div className="flex flex-col gap-10">
      {successMessage ? (
        <div
          role="status"
          className="rounded-2xl border border-neon-lime/40 bg-neon-lime/10 px-4 py-3 text-sm leading-relaxed text-neon-lime shadow-[0_0_28px_-10px_var(--color-neon-lime)]"
        >
          {successMessage}
        </div>
      ) : null}

      <section aria-labelledby="free-title" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="free-title" className="text-lg font-semibold tracking-tight">
              Tus objetivos
            </h2>
            <p className="text-sm text-muted-foreground">
              4 categorías activas · 21 días + niveles infinitos
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {freeHabits.map((habit) => (
            <HabitCard
              key={habit.title}
              habit={habit}
              onOpenChallenge={(h) => {
                if (!h.id) return
                setActive({ categoryId: h.id })
              }}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="pro-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="pro-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              Desbloquea con PRO
              <Crown className="size-4 text-neon-yellow" aria-hidden="true" />
            </h2>
            <p className="text-sm text-muted-foreground">Más categorías y retos a tu medida</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border border-neon-purple/60 bg-neon-purple/10 px-5 text-sm font-semibold text-neon-purple shadow-[0_0_24px_-6px_var(--color-neon-purple)] transition-all hover:bg-neon-purple/20 sm:self-auto"
          >
            <Crown className="size-4" aria-hidden="true" />
            Hazte PRO
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {proHabits.map((habit) => (
            <HabitCard key={habit.title} habit={habit} />
          ))}
        </div>
      </section>

      <HabitChallengeModal
        open={active !== null}
        categoryId={active?.categoryId ?? null}
        completed={active ? getCompleted(active.categoryId) : 0}
        onClose={() => setActive(null)}
        onCapture={() => {
          if (!active) return
          const categoryId = active.categoryId
          setActive(null)
          openCaptureForCategory(categoryId)
        }}
      />

      <CaptureModal
        open={captureOpen}
        challenge={captureChallenge}
        onClose={() => {
          setCaptureOpen(false)
          setCaptureChallenge(null)
        }}
        onConfirm={handleValidated}
      />

      <HabitCelebrationModal
        open={celebration !== null}
        kind={celebration?.kind ?? null}
        level={celebration?.level ?? 1}
        day={celebration?.day ?? 0}
        categoryTitle={
          celebration
            ? `${getCategoryMeta(celebration.categoryId).title} · ${getLevelMeta(celebration.level).name}`
            : ''
        }
        glowColor={
          celebration ? getCategoryMeta(celebration.categoryId).color : undefined
        }
        onClose={closeCelebration}
      />
    </div>
  )
}
