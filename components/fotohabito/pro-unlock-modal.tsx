'use client'

import { useEffect, useId, useState } from 'react'
import {
  BarChart3,
  Check,
  Crown,
  Lock,
  Palette,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react'
import { useKorePro } from './kore-pro-context'
import {
  KORE_FREE_FEATURES,
  KORE_PRO_FEATURES,
  KORE_PRO_PLANS,
  type KoreProPlanId,
} from '@/lib/kore-pro'
import { cn } from '@/lib/utils'

type ProUnlockModalProps = {
  open: boolean
  title: string
  description?: string
  reason?: 'limit' | 'feature' | 'category'
  onClose: () => void
}

const FEATURE_ICONS = [Target, Users, Palette, BarChart3] as const

export function ProUnlockModal({
  open,
  title,
  description,
  reason = 'feature',
  onClose,
}: ProUnlockModalProps) {
  const titleId = useId()
  const { subscribe, isPro } = useKorePro()
  const [selected, setSelected] = useState<KoreProPlanId>('yearly')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected('yearly')
    setBusy(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const eyebrow =
    reason === 'limit'
      ? 'Límite gratuito'
      : reason === 'category'
        ? 'Objetivo PRO'
        : 'Kore PRO'

  const headline =
    reason === 'limit'
      ? 'Pasa a Kore PRO para más objetivos'
      : title
        ? `Desbloquea ${title}`
        : 'Desbloquea Kore PRO'

  const sub =
    description ??
    (reason === 'limit'
      ? 'En la versión gratuita puedes tener hasta 2 objetivos activos. Con PRO, gestiona ilimitados a la vez.'
      : 'Suscríbete a Kore PRO y desbloquea objetivos ilimitados, retos con amigos, objetivos personalizados y estadísticas avanzadas.')

  function handleSubscribe() {
    setBusy(true)
    window.setTimeout(() => {
      subscribe(selected)
      setBusy(false)
      onClose()
    }, 420)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex max-h-[min(94dvh,820px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-neon-yellow/45 bg-card',
          'shadow-[0_0_60px_-12px_var(--color-neon-yellow)]',
          'animate-in fade-in zoom-in-95 duration-300',
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-yellow to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-neon-yellow/20 blur-3xl"
        />

        <div className="relative shrink-0 border-b border-white/5 px-5 pb-4 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-full border border-neon-yellow/50 bg-neon-yellow/10 text-neon-yellow shadow-[0_0_28px_-6px_var(--color-neon-yellow)]">
              <Crown className="size-6" aria-hidden="true" />
            </span>
            <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-neon-yellow">
              <Lock className="size-3" aria-hidden="true" />
              {eyebrow}
            </p>
            <h2
              id={titleId}
              className="text-balance text-2xl font-semibold tracking-tight text-foreground"
            >
              {headline}
            </h2>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              {sub}
            </p>
            {isPro ? (
              <p className="rounded-full border border-neon-lime/40 bg-neon-lime/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-neon-lime">
                Ya eres Kore PRO
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Elige tu plan
          </p>
          <ul className="space-y-2">
            {KORE_PRO_PLANS.map((plan) => {
              const active = selected === plan.id
              return (
                <li key={plan.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(plan.id)}
                    className={cn(
                      'relative flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all',
                      active
                        ? 'border-neon-yellow/60 bg-neon-yellow/10 shadow-[0_0_24px_-10px_var(--color-neon-yellow)]'
                        : 'border-white/10 bg-background/40 hover:border-neon-yellow/35',
                      plan.highlight && !active && 'border-neon-yellow/30',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                        active
                          ? 'border-neon-yellow bg-neon-yellow text-background'
                          : 'border-white/20',
                      )}
                    >
                      {active ? <Check className="size-3 stroke-[3]" aria-hidden="true" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                        {plan.badge ? (
                          <span className="rounded-full border border-neon-yellow/50 bg-neon-yellow/15 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-neon-yellow">
                            {plan.badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-lg font-semibold tabular-nums text-neon-yellow">
                          {plan.priceLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">{plan.periodLabel}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {plan.detail}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-background/40 p-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Gratis
              </p>
              <ul className="mt-2 space-y-1.5">
                {KORE_FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-1.5 text-[11px] leading-snug text-muted-foreground">
                    <Check className="mt-0.5 size-3 shrink-0 text-neon-cyan" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-neon-yellow/35 bg-neon-yellow/5 p-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-neon-yellow">
                Kore PRO
              </p>
              <ul className="mt-2 space-y-1.5">
                {KORE_PRO_FEATURES.map((f, i) => {
                  const Icon = FEATURE_ICONS[i] ?? Sparkles
                  return (
                    <li
                      key={f}
                      className="flex gap-1.5 text-[11px] leading-snug text-foreground/90"
                    >
                      <Icon className="mt-0.5 size-3 shrink-0 text-neon-yellow" aria-hidden="true" />
                      {f}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative shrink-0 border-t border-white/5 px-5 py-4">
          <button
            type="button"
            disabled={busy || isPro}
            onClick={handleSubscribe}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neon-yellow px-6 text-sm font-semibold text-background shadow-[0_0_32px_-6px_var(--color-neon-yellow)] transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            <Crown className="size-4" aria-hidden="true" />
            {isPro ? 'Ya tienes PRO' : busy ? 'Activando…' : 'Suscribirme a Kore PRO'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Seguir con la versión gratuita
          </button>
        </div>
      </div>
    </div>
  )
}
