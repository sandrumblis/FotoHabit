import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Lock } from 'lucide-react'

export type Habit = {
  title: string
  subtitle: string
  icon: LucideIcon
  color?: string
  completed?: number
  total?: number
  locked?: boolean
}

export function HabitCard({ habit }: { habit: Habit }) {
  const { title, subtitle, icon: Icon, color, completed = 0, total = 30, locked } = habit

  if (locked) {
    return (
      <article className="relative aspect-[4/3] rounded-2xl sm:aspect-square">
        <span className="absolute right-4 top-4 z-10 rounded-full border border-neon-yellow/60 bg-neon-yellow/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-neon-yellow shadow-[0_0_16px_-2px_var(--color-neon-yellow)]">
          PRO
        </span>
        <div className="flex size-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 opacity-60 grayscale transition-opacity hover:opacity-80">
        <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-zinc-300">{title}</h3>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Lock className="size-3" aria-hidden="true" />
            {subtitle}
          </p>
        </div>
        </div>
      </article>
    )
  }

  const progress = Math.round((completed / total) * 100)

  return (
    <article
      style={{ '--glow': color } as CSSProperties}
      className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--glow)_55%,transparent)] bg-card p-5 shadow-[0_0_28px_-10px_var(--glow),inset_0_0_24px_-16px_var(--glow)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-8px_var(--glow),inset_0_0_24px_-12px_var(--glow)] sm:aspect-square"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[var(--glow)] opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
      />

      <div className="relative flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl border border-[color-mix(in_oklab,var(--glow)_40%,transparent)] bg-[color-mix(in_oklab,var(--glow)_12%,transparent)] text-[var(--glow)] [filter:drop-shadow(0_0_6px_var(--glow))]">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span className="font-mono text-xs text-[var(--glow)]">{progress}%</span>
      </div>

      <div className="relative flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {completed}/{total} · {subtitle}
          </p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/5"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de ${title}`}
        >
          <div
            className="h-full rounded-full bg-[var(--glow)] shadow-[0_0_10px_var(--glow)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--glow)] after:absolute after:inset-0 focus-visible:outline-none"
        >
          Ver reto
          <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  )
}
