import Link from 'next/link'
import { Flame, Images, Users } from 'lucide-react'

const METRICS = [
  {
    label: 'Seguidores',
    value: '128',
    icon: Users,
    accent: 'text-neon-cyan',
    ring: 'border-neon-cyan/30 bg-neon-cyan/10',
    glow: 'shadow-[0_0_20px_-8px_var(--color-neon-cyan)]',
  },
  {
    label: 'Fuegos',
    value: '450',
    icon: Flame,
    accent: 'text-neon-yellow',
    ring: 'border-neon-yellow/30 bg-neon-yellow/10',
    glow: 'shadow-[0_0_20px_-8px_var(--color-neon-yellow)]',
  },
  {
    label: 'Publicaciones',
    value: '13',
    icon: Images,
    accent: 'text-neon-purple',
    ring: 'border-neon-purple/30 bg-neon-purple/10',
    glow: 'shadow-[0_0_20px_-8px_var(--color-neon-purple)]',
  },
] as const

const CTA_CLASS =
  'inline-flex h-12 w-full items-center justify-center gap-2 self-start rounded-full bg-neon-cyan px-6 text-sm font-semibold text-background shadow-[0_0_32px_-4px_var(--color-neon-cyan)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_-2px_var(--color-neon-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto'

export function CommunityBanner() {
  return (
    <section
      aria-labelledby="community-banner-title"
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-card p-5 sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-lime"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -bottom-24 size-64 rounded-full bg-neon-purple/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-0 size-48 rounded-full bg-neon-cyan/15 blur-3xl"
      />

      <div className="relative flex h-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-neon-purple">
            <Users className="size-3.5" aria-hidden="true" />
            Perfil social
          </span>
          <h2
            id="community-banner-title"
            className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Comunidad &amp; Amigos
          </h2>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Mira el progreso de tus amigos y comparte tus hábitos superados.
          </p>
        </div>

        <ul className="grid flex-1 grid-cols-3 content-start gap-2 sm:gap-3">
          {METRICS.map((metric) => {
            const Icon = metric.icon
            return (
              <li
                key={metric.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-background/50 px-2 py-3 sm:px-3 sm:py-4"
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-full border ${metric.ring} ${metric.accent} ${metric.glow}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {metric.value}
                </span>
                <span className="text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                  {metric.label}
                </span>
              </li>
            )
          })}
        </ul>

        <Link href="/" className={CTA_CLASS}>
          <Users className="size-4" aria-hidden="true" />
          Ver Feed de Comunidad
        </Link>
      </div>
    </section>
  )
}
