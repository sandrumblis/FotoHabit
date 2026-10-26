'use client'

import {
  BarChart3,
  Bell,
  Crown,
  Flame,
  LogOut,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import { useAuth } from './auth-context'
import { useAppNav, type AppMainView } from './app-nav-context'
import { BrandLogo } from './brand-logo'
import { CommunityAvatar } from './community-avatar'
import { useExploreObjectives } from './explore-objectives-context'
import { useHabitProgress } from './habit-progress-context'
import { useKorePro } from './kore-pro-context'
import { useProfileSettings } from './profile-settings-context'
import { getLevelFromCompleted } from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

const navPillClass =
  'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 sm:h-10 sm:px-4 sm:text-sm'

const NAV_ITEMS: Array<{
  id: AppMainView
  label: string
  icon: typeof Users
  active: string
  idle: string
  ring: string
}> = [
  {
    id: 'community',
    label: 'Comunidad',
    icon: Users,
    active:
      'border-neon-cyan/55 bg-neon-cyan/20 text-neon-cyan shadow-[0_0_24px_-4px_var(--color-neon-cyan)]',
    idle:
      'border-neon-cyan/25 bg-card/90 text-neon-cyan/70 shadow-[0_0_14px_-8px_var(--color-neon-cyan)] hover:border-neon-cyan/40 hover:bg-neon-cyan/10 hover:text-neon-cyan',
    ring: 'focus-visible:ring-neon-cyan',
  },
  {
    id: 'objectives',
    label: 'Objetivos',
    icon: Target,
    active:
      'border-neon-fuchsia/55 bg-neon-fuchsia/20 text-neon-fuchsia shadow-[0_0_24px_-4px_var(--color-neon-fuchsia)]',
    idle:
      'border-neon-fuchsia/25 bg-card/90 text-neon-fuchsia/70 shadow-[0_0_14px_-8px_var(--color-neon-fuchsia)] hover:border-neon-fuchsia/40 hover:bg-neon-fuchsia/10 hover:text-neon-fuchsia',
    ring: 'focus-visible:ring-neon-fuchsia',
  },
  {
    id: 'analytics',
    label: 'Análisis',
    icon: BarChart3,
    active:
      'border-neon-lime/55 bg-neon-lime/20 text-neon-lime shadow-[0_0_24px_-4px_var(--color-neon-lime)]',
    idle:
      'border-neon-lime/25 bg-card/90 text-neon-lime/70 shadow-[0_0_14px_-8px_var(--color-neon-lime)] hover:border-neon-lime/40 hover:bg-neon-lime/10 hover:text-neon-lime',
    ring: 'focus-visible:ring-neon-lime',
  },
]

function HeaderUserChip() {
  const { logout } = useAuth()
  const { getCompleted } = useHabitProgress()
  const { displayName, avatarUrl, initials, openSettings } = useProfileSettings()
  const streak = getCompleted('actividad-fisica')
  const level = getLevelFromCompleted(streak)

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-card/80 py-0.5 pl-0.5 pr-0.5 backdrop-blur-md sm:gap-1 sm:py-1 sm:pl-1 sm:pr-1">
      <button
        type="button"
        onClick={openSettings}
        className="flex items-center gap-2 rounded-full pr-0.5 text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
        aria-label="Abrir ajustes de perfil"
        title="Ajustes de perfil"
      >
        <div className="relative">
          <CommunityAvatar
            initials={initials || 'FH'}
            src={avatarUrl}
            size="sm"
            accent="cyan"
          />
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-background bg-neon-purple px-1.5 font-mono text-[8px] font-bold leading-4 text-white">
            {level}
          </span>
        </div>
        <div className="hidden min-w-0 flex-col leading-tight lg:flex">
          <span className="max-w-[6.5rem] truncate text-xs font-medium text-foreground">
            {displayName}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-neon-yellow">
            <Flame className="size-2.5 fill-neon-yellow" aria-hidden="true" />
            Nv.{level} · {streak}d
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={logout}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function DashboardHeader() {
  const { view, setView } = useAppNav()
  const { openAddGoal, isAddGoalOpen } = useExploreObjectives()
  const { isPro, openProModal } = useKorePro()

  const activeView: AppMainView = isAddGoalOpen ? 'objectives' : view

  function go(next: AppMainView) {
    if (next === 'objectives') {
      setView('community')
      openAddGoal()
      return
    }
    setView(next)
  }

  return (
    <div className="sticky top-0 z-30 w-full overflow-x-hidden">
      <header className="w-full border-b border-white/5 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 py-2.5 sm:max-w-6xl sm:gap-4 sm:px-6 sm:py-3">
          <button
            type="button"
            onClick={() => go('community')}
            className="min-w-0 flex-1 overflow-hidden bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
            aria-label="FotoHabit — inicio"
          >
            <BrandLogo size="sm" className="max-w-full" />
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() =>
                openProModal({
                  title: isPro ? 'FotoHabit PRO' : 'Hazte PRO',
                  description: isPro
                    ? 'Ya disfrutas de FotoHabit PRO. Revisa planes o gestiona tu suscripción.'
                    : 'Desbloquea objetivos ilimitados, retos con amigos y estadísticas avanzadas.',
                  reason: 'feature',
                })
              }
              className={cn(
                navPillClass,
                'h-8 shrink-0 gap-1 px-2.5 sm:h-10 sm:px-4',
                'border-neon-yellow/55 bg-neon-yellow/15 text-neon-yellow',
                'shadow-[0_0_22px_-6px_var(--color-neon-yellow)]',
                'hover:scale-[1.02] hover:bg-neon-yellow/25',
                'focus-visible:ring-neon-yellow',
              )}
            >
              {isPro ? (
                <Crown className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Zap className="size-3.5 shrink-0 fill-neon-yellow" aria-hidden="true" />
              )}
              <span className="hidden whitespace-nowrap uppercase tracking-wide sm:inline">
                {isPro ? 'PRO' : 'Hazte PRO'}
              </span>
              <span className="uppercase tracking-wide sm:hidden">PRO</span>
            </button>

            <button
              type="button"
              className="relative hidden size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:text-foreground md:flex"
              aria-label="Notificaciones"
            >
              <Bell className="size-4" aria-hidden="true" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-neon-lime" />
            </button>

            <HeaderUserChip />
          </div>
        </div>
      </header>

      <div className="w-full overflow-x-auto border-b border-white/5 bg-background/70 backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav
          aria-label="Principal"
          className="mx-auto flex w-full max-w-2xl items-center justify-center gap-1.5 px-4 py-2.5 sm:max-w-6xl sm:gap-3 sm:px-6 sm:py-3"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cn(
                  navPillClass,
                  'h-8 shrink-0 px-2.5 text-[11px] sm:h-10 sm:px-4 sm:text-sm',
                  item.ring,
                  active ? item.active : item.idle,
                )}
              >
                <Icon className="size-3.5 shrink-0 sm:size-4" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
