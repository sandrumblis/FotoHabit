import {
  Brain,
  CigaretteOff,
  Coins,
  Crown,
  Dumbbell,
  Flower2,
  Moon,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { HabitCard, type Habit } from './habit-card'

const freeHabits: Habit[] = [
  { title: 'Actividad Física', subtitle: '30 retos diarios', icon: Dumbbell, color: 'var(--color-neon-cyan)', completed: 12 },
  { title: 'Orden y Limpieza', subtitle: '30 retos diarios', icon: Sparkles, color: 'var(--color-neon-lime)', completed: 8 },
  { title: 'Ahorro y Finanzas', subtitle: '30 retos diarios', icon: Coins, color: 'var(--color-neon-yellow)', completed: 19 },
  { title: 'Enfoque y Mente', subtitle: '30 retos diarios', icon: Brain, color: 'var(--color-neon-purple)', completed: 5 },
]

const proHabits: Habit[] = [
  { title: 'Sueño y Descanso', subtitle: '30 retos diarios', icon: Moon, locked: true },
  { title: 'Belleza y Cuidado Personal', subtitle: '30 retos diarios', icon: Flower2, locked: true },
  { title: 'Sin Humos', subtitle: '45 retos diarios', icon: CigaretteOff, locked: true },
  { title: 'Reto Personalizado', subtitle: 'Crea tu propio reto', icon: WandSparkles, locked: true },
]

export function HabitGrid() {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="free-title" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="free-title" className="text-lg font-semibold tracking-tight">
              Tus objetivos
            </h2>
            <p className="text-sm text-muted-foreground">4 categorías activas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {freeHabits.map((habit) => (
            <HabitCard key={habit.title} habit={habit} />
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
    </div>
  )
}
