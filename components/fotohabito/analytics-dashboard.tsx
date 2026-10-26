'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Flame, Heart, Percent, Trophy, Zap } from 'lucide-react'
import { useAuth } from './auth-context'
import { useHabitProgress } from './habit-progress-context'
import { ShareProgressModal } from './share-progress-modal'
import { useSocialFeed } from './social-feed-context'
import {
  ACCENT_STYLES,
  CURRENT_USER_ID,
  getCurrentUser,
} from '@/lib/community-data'
import { getLevelFromCompleted } from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

const WEEK_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const TOP_POSTS_LIMIT = 6

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function AnalyticsDashboard() {
  const { progress, activeCategoryIds, getCompleted, isTodayValidated } = useHabitProgress()
  const { getPostsByUserId } = useSocialFeed()
  const { user } = useAuth()
  const me = getCurrentUser()
  const [shareOpen, setShareOpen] = useState(false)

  const displayName = user?.name ?? me.name
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const totalValidated = useMemo(
    () => Object.values(progress).reduce((sum, n) => sum + (n || 0), 0),
    [progress],
  )

  const longestStreak = useMemo(() => {
    const values = activeCategoryIds.map((id) => getCompleted(id))
    return values.length ? Math.max(...values) : 0
  }, [activeCategoryIds, getCompleted])

  const successRate = useMemo(() => {
    if (activeCategoryIds.length === 0) return 0
    const rates = activeCategoryIds.map((id) => {
      const done = getCompleted(id)
      return Math.min(100, Math.round((done / 21) * 100))
    })
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
  }, [activeCategoryIds, getCompleted])

  const myPosts = useMemo(
    () => getPostsByUserId(CURRENT_USER_ID),
    [getPostsByUserId],
  )

  const totalFueguitos = useMemo(
    () => myPosts.reduce((sum, p) => sum + (p.likes || 0), 0) || me.likesCount,
    [myPosts, me.likesCount],
  )

  const topPosts = useMemo(
    () =>
      [...myPosts]
        .filter((p) => p.previewUrl || p.imageUrl)
        .sort((a, b) => b.likes - a.likes)
        .slice(0, TOP_POSTS_LIMIT),
    [myPosts],
  )

  const weeklyBars = useMemo(() => {
    const base = Math.max(1, Math.round(totalValidated / 14))
    return WEEK_LABELS.map((label, i) => {
      const boost = activeCategoryIds.some((id) => isTodayValidated(id)) && i === 6 ? 1 : 0
      const value = Math.max(
        0,
        Math.min(
          activeCategoryIds.length || 3,
          Math.round(base * (0.45 + seeded(i + totalValidated) * 0.9) + boost),
        ),
      )
      return { label, value }
    })
  }, [totalValidated, activeCategoryIds, isTodayValidated])

  const maxBar = Math.max(1, ...weeklyBars.map((b) => b.value))

  // Compact heat strip kept only for the share card thumbnail
  const heatDays = useMemo(() => {
    const days: Array<{ day: number; intensity: number }> = []
    const today = new Date().getDate()
    for (let d = 1; d <= 28; d++) {
      if (d > today) {
        days.push({ day: d, intensity: 0 })
        continue
      }
      const roll = seeded(d * 17 + totalValidated)
      let intensity = 0
      if (d === today && activeCategoryIds.some((id) => isTodayValidated(id))) {
        intensity = 3
      } else if (roll > 0.72) intensity = 3
      else if (roll > 0.48) intensity = 2
      else if (roll > 0.28) intensity = 1
      days.push({ day: d, intensity })
    }
    return days
  }, [totalValidated, activeCategoryIds, isTodayValidated])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-yellow">
            Dashboard
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Análisis
          </h1>
          <p className="max-w-xl text-pretty text-sm text-muted-foreground">
            Constancia, apoyo de la comunidad y rendimiento de tus hábitos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className={cn(
            'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold uppercase tracking-wide',
            'border-neon-yellow/55 bg-neon-yellow/15 text-neon-yellow',
            'shadow-[0_0_22px_-6px_var(--color-neon-yellow)]',
            'transition-transform hover:scale-[1.02] hover:bg-neon-yellow/25',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-yellow',
          )}
        >
          <Zap className="size-3.5 fill-neon-yellow" aria-hidden="true" />
          <span className="hidden sm:inline">Compartir progreso</span>
          <span className="sm:hidden">Compartir</span>
        </button>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          icon={Trophy}
          label="Racha más larga"
          value={`${longestStreak}d`}
          hint={`Nivel ${getLevelFromCompleted(longestStreak)}`}
          accent="text-neon-yellow"
          border="border-neon-yellow/35"
        />
        <MetricCard
          icon={Percent}
          label="Éxito reto 21 días"
          value={`${successRate}%`}
          hint="Media de objetivos activos"
          accent="text-neon-cyan"
          border="border-neon-cyan/35"
        />
        <MetricCard
          icon={Heart}
          label="Fueguitos 🔥"
          value={String(totalFueguitos)}
          hint="Me gusta / apoyo de la comunidad"
          accent="text-neon-fuchsia"
          border="border-neon-fuchsia/35"
        />
      </ul>

      <section className="rounded-3xl border border-white/10 bg-card/80 p-5 shadow-[0_0_40px_-20px_rgba(0,240,255,0.25)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan">
              Constancia
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              Hábitos completados · Últimos 7 días
            </h2>
          </div>
          <BarChart3 className="size-5 text-neon-cyan" aria-hidden="true" />
        </div>

        <div className="flex h-44 items-end gap-2 sm:gap-3">
          {weeklyBars.map((bar) => {
            const h = Math.max(8, Math.round((bar.value / maxBar) * 100))
            return (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {bar.value}
                </span>
                <div className="relative flex h-28 w-full items-end justify-center">
                  <div
                    className="w-full max-w-[2.25rem] rounded-t-xl bg-gradient-to-t from-neon-cyan/30 via-neon-cyan to-neon-lime shadow-[0_0_18px_-6px_var(--color-neon-cyan)] transition-all"
                    style={{ height: `${h}%` }}
                    title={`${bar.label}: ${bar.value}`}
                  />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {bar.label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-neon-yellow/25 bg-card/80 p-5 shadow-[0_0_40px_-18px_rgba(255,214,0,0.28)]">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-yellow">
              Top Fueguitos 🔥
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              Tus publicaciones más populares
            </h2>
          </div>
          <Flame className="size-5 fill-neon-yellow text-neon-yellow" aria-hidden="true" />
        </div>
        <p className="mb-4 max-w-lg text-sm text-muted-foreground">
          Tus fotos con más me gusta / apoyo recibido de la comunidad.
        </p>

        {topPosts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no tienes publicaciones con fueguitos. Publica una prueba validada para aparecer aquí.
          </p>
        ) : (
          <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {topPosts.map((post) => {
              const photo = post.previewUrl || post.imageUrl
              const accent = ACCENT_STYLES[post.accent]
              return (
                <li
                  key={post.id}
                  className={cn(
                    'relative w-[78%] shrink-0 overflow-hidden rounded-2xl border bg-background/60 sm:w-auto',
                    accent.border,
                  )}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo ?? ''}
                      alt={post.habit}
                      className="size-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                    <span
                      className={cn(
                        'absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-bold tabular-nums',
                        'border-neon-yellow/60 bg-background/90 text-neon-yellow',
                        'shadow-[0_0_20px_-4px_var(--color-neon-yellow)] backdrop-blur-md',
                      )}
                    >
                      🔥 {post.likes}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 space-y-1 p-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
                          accent.border,
                          accent.soft,
                          accent.text,
                        )}
                      >
                        {post.habit}
                      </span>
                      <p className="font-mono text-[11px] text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ShareProgressModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        data={{
          displayName,
          initials: initials || 'KO',
          longestStreak,
          successRate,
          totalValidated,
          totalFueguitos,
          weeklyBars,
          heatDays,
        }}
      />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  border,
}: {
  icon: typeof Flame
  label: string
  value: string
  hint: string
  accent: string
  border: string
}) {
  return (
    <li className={cn('rounded-3xl border bg-card/80 p-4', border)}>
      <div className={cn('mb-2 flex items-center gap-2', accent)}>
        <Icon className="size-4" aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </li>
  )
}
