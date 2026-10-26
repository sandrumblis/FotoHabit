import { Bell, Flame } from 'lucide-react'
import { BrandLogo } from './brand-logo'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandLogo />

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative hidden size-10 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:text-foreground sm:flex"
            aria-label="Notificaciones"
          >
            <Bell className="size-4" aria-hidden="true" />
            <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-neon-lime" />
          </button>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-card py-1 pl-1 pr-3">
            <div className="relative">
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-yellow p-[2px]">
                <div className="flex size-full items-center justify-center rounded-full bg-card text-xs font-semibold text-foreground">
                  LM
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 rounded-full border border-background bg-neon-purple px-1.5 font-mono text-[9px] font-bold leading-4 text-white">
                7
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium text-foreground">Laura M.</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-neon-yellow">
                <Flame className="size-3" aria-hidden="true" />
                <span>
                  12 días <span className="sr-only">de racha</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
