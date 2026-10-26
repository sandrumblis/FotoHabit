'use client'

import { Flame, Images, UserPlus, Users } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import { EditableProfileBio } from './editable-profile-bio'
import { ACCENT_STYLES, type CommunityUser } from '@/lib/community-data'
import {
  formatCommunityLevelLine,
  getLevelBlockDays,
  getLevelFromCompleted,
} from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

const ACCENT_CSS = {
  cyan: 'var(--color-neon-cyan)',
  yellow: 'var(--color-neon-yellow)',
  lime: 'var(--color-neon-lime)',
  fuchsia: 'var(--color-neon-fuchsia)',
  purple: 'var(--color-neon-purple)',
} as const

export type ProfileMetricKey = 'posts' | 'followers' | 'following' | 'fires'

export type ProfileMetricOverrides = Partial<{
  postsCount: number
  followersCount: number
  followingCount: number
  likesCount: number
  streak: number
  primaryHabit: string
}>

type CommunityProfileBannerProps = {
  user: CommunityUser
  onMetricClick: (metric: ProfileMetricKey) => void
  onOpenProfile: () => void
  overrides?: ProfileMetricOverrides
}

const METRICS: Array<{
  key: ProfileMetricKey
  label: string
  icon: typeof Images
  getValue: (u: CommunityUser) => number
  accentClass: string
}> = [
  {
    key: 'posts',
    label: 'Publicaciones',
    icon: Images,
    getValue: (u) => u.postsCount,
    accentClass: 'text-neon-purple hover:border-neon-purple/50 hover:bg-neon-purple/10',
  },
  {
    key: 'followers',
    label: 'Seguidores',
    icon: Users,
    getValue: (u) => u.followersCount,
    accentClass: 'text-neon-cyan hover:border-neon-cyan/50 hover:bg-neon-cyan/10',
  },
  {
    key: 'following',
    label: 'Seguidos',
    icon: UserPlus,
    getValue: (u) => u.followingCount,
    accentClass: 'text-neon-lime hover:border-neon-lime/50 hover:bg-neon-lime/10',
  },
  {
    key: 'fires',
    label: 'Fuegos',
    icon: Flame,
    getValue: (u) => u.likesCount,
    accentClass:
      'text-neon-yellow hover:border-neon-yellow/50 hover:bg-neon-yellow/10 hover:shadow-[0_0_24px_-8px_var(--color-neon-yellow)]',
  },
]

export function CommunityProfileBanner({
  user,
  onMetricClick,
  onOpenProfile,
  overrides,
}: CommunityProfileBannerProps) {
  const displayUser: CommunityUser = { ...user, ...overrides }
  const styles = ACCENT_STYLES[displayUser.accent]
  const level = getLevelFromCompleted(displayUser.streak)
  const block = getLevelBlockDays(displayUser.streak)
  const ringColor = ACCENT_CSS[displayUser.accent]

  return (
    <section
      aria-labelledby="profile-banner-title"
      className={cn(
        'relative overflow-visible rounded-3xl border bg-card p-5 sm:p-6',
        styles.border,
        styles.ring,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-fuchsia" />
        <div
          className={cn(
            'absolute -right-20 -top-24 size-56 rounded-full bg-gradient-to-br blur-3xl',
            styles.glow,
            'to-neon-purple/20',
          )}
        />
        <div className="absolute -bottom-24 -left-16 size-48 rounded-full bg-neon-fuchsia/15 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-5">
        <div className="flex items-start gap-4 sm:gap-5">
          <button
            type="button"
            onClick={onOpenProfile}
            className="group flex shrink-0 flex-col items-center gap-1.5 overflow-visible rounded-full transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
            aria-label={`Ver perfil de ${displayUser.name}. Progreso al siguiente nivel: ${block.done} de ${block.total}`}
          >
            <CommunityAvatar
              initials={displayUser.initials}
              accent={displayUser.accent}
              size="xl"
              progress={block.ratio}
              ringColor={ringColor}
            />
            <span
              className="font-mono text-[10px] tabular-nums tracking-tight"
              style={{ color: ringColor }}
            >
              {block.done}/{block.total} días
            </span>
          </button>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan">
              Tu perfil
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h2
                id="profile-banner-title"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="transition-colors hover:text-neon-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
                >
                  {displayUser.name}
                </button>
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-neon-yellow/40 bg-neon-yellow/10 px-2.5 py-0.5 font-mono text-[11px] text-neon-yellow shadow-[0_0_16px_-6px_var(--color-neon-yellow)]">
                <Flame className="size-3 fill-neon-yellow" aria-hidden="true" />
                Nivel {level} · {displayUser.streak} días
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-neon-cyan">
              {formatCommunityLevelLine(displayUser.primaryHabit, displayUser.streak)} 🔥
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              Siguiente nivel · {block.done}/{block.total} días ({block.percent}%)
            </p>
            <EditableProfileBio editable={Boolean(displayUser.isSelf)} className="mt-2" />
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {METRICS.map((metric) => {
            const Icon = metric.icon
            const value = metric.getValue(displayUser)
            return (
              <li key={metric.key}>
                <button
                  type="button"
                  onClick={() => onMetricClick(metric.key)}
                  className={cn(
                    'group flex w-full flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-background/50 px-2 py-3 transition-all duration-300',
                    'hover:-translate-y-0.5 hover:shadow-[0_0_24px_-10px_currentColor]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
                    metric.accentClass,
                  )}
                >
                  <span className="flex size-8 items-center justify-center rounded-full border border-current/30 bg-current/10 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {value}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    {metric.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
