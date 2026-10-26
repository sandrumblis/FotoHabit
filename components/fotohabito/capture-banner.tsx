'use client'

import { useState } from 'react'
import { Camera, Check, Globe2, Lock, Target, Timer } from 'lucide-react'
import { CaptureModal, type CaptureResult } from './capture-modal'
import { useHabitProgress } from './habit-progress-context'
import { getCategoryMeta, getChallenge, getCurrentDay } from '@/lib/habit-challenges'
import {
  getCurrentLevel,
  getLevelMeta,
  isMaintenanceDay,
} from '@/lib/habit-levels'

const CTA_BASE =
  'inline-flex h-12 w-full items-center justify-center gap-2 self-start rounded-full px-6 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto'

const CATEGORY_ID = 'actividad-fisica' as const

export function CaptureBanner() {
  const {
    getCompleted,
    completeDay,
    canValidateToday,
    dailyValidationMessage,
    isTodayValidated,
  } = useHabitProgress()
  const completed = getCompleted(CATEGORY_ID)
  const lockedToday = isTodayValidated(CATEGORY_ID)
  const currentDay = getCurrentDay(completed)
  const level = getCurrentLevel(completed)
  const levelMeta = getLevelMeta(level)
  const challenge = getChallenge(CATEGORY_ID, currentDay)
  const maintenance = isMaintenanceDay(currentDay)
  const categoryMeta = getCategoryMeta(CATEGORY_ID)

  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<CaptureResult | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  function handleConfirm(next: CaptureResult) {
    if (!next.valid) return
    const completion = completeDay(CATEGORY_ID)
    if (!completion.ok) {
      setBlockedMessage(completion.message)
      window.setTimeout(() => setBlockedMessage(null), 5600)
      return
    }
    setResult(next)
    setBlockedMessage(null)
  }

  return (
    <div className="h-full">
      <section
        aria-labelledby="capture-title"
        className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-card p-5 sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-neon-cyan via-neon-lime via-60% to-neon-purple"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-neon-cyan/15 blur-3xl"
        />

        <div className="relative flex h-full flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan">
              Nivel {level} · {levelMeta.short} · Día {currentDay}
            </span>
            <h2 id="capture-title" className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {result?.valid ? '¡Prueba registrada!' : challenge.title}
            </h2>
            <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              {result?.valid
                ? result.message
                : challenge.description}
            </p>
            {result?.valid ? (
              <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-neon-lime">
                {result.privacy === 'network' ? (
                  <Lock className="size-3.5" aria-hidden="true" />
                ) : (
                  <Globe2 className="size-3.5" aria-hidden="true" />
                )}
                {result.privacy === 'network' ? 'Publicado en Mi Red' : 'Publicado en Feed Global'}
                {result.caption ? ` · “${result.caption}”` : null}
              </p>
            ) : null}
          </div>

          <ul className="grid flex-1 grid-cols-3 content-start gap-2 sm:gap-3">
            <li className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-background/50 px-2 py-3 sm:px-3 sm:py-4">
              <span className="flex size-9 items-center justify-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_20px_-8px_var(--color-neon-cyan)]">
                <Target className="size-4" aria-hidden="true" />
              </span>
              <span className="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {currentDay}
              </span>
              <span className="text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                Día hábito
              </span>
            </li>
            <li className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-background/50 px-2 py-3 sm:px-3 sm:py-4">
              <span className="flex size-9 items-center justify-center rounded-full border border-neon-yellow/30 bg-neon-yellow/10 text-neon-yellow shadow-[0_0_20px_-8px_var(--color-neon-yellow)]">
                <Timer className="size-4" aria-hidden="true" />
              </span>
              <span className="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {level}
              </span>
              <span className="text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                Nivel
              </span>
            </li>
            <li className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-background/50 px-2 py-3 sm:px-3 sm:py-4">
              <span className="flex size-9 items-center justify-center rounded-full border border-neon-lime/30 bg-neon-lime/10 text-neon-lime shadow-[0_0_20px_-8px_var(--color-neon-lime)]">
                <Check className="size-4" aria-hidden="true" />
              </span>
              <span className="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {result?.valid ? 'OK' : completed}
              </span>
              <span className="text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                {result?.valid ? 'Validado' : 'Racha'}
              </span>
            </li>
          </ul>

          {blockedMessage || (lockedToday && !result?.valid) ? (
            <p
              role="status"
              className="rounded-2xl border border-neon-yellow/35 bg-neon-yellow/10 px-3 py-2 text-center text-xs leading-relaxed text-neon-yellow"
            >
              {blockedMessage ?? dailyValidationMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (!canValidateToday(CATEGORY_ID)) {
                setBlockedMessage(dailyValidationMessage)
                window.setTimeout(() => setBlockedMessage(null), 5600)
                return
              }
              setResult(null)
              setBlockedMessage(null)
              setOpen(true)
            }}
            disabled={lockedToday && !result?.valid}
            className={
              result?.valid || lockedToday
                ? `${CTA_BASE} border border-neon-lime/60 bg-neon-lime/10 text-neon-lime shadow-[0_0_24px_-6px_var(--color-neon-lime)] disabled:cursor-not-allowed disabled:opacity-70`
                : `${CTA_BASE} bg-neon-cyan text-background shadow-[0_0_32px_-4px_var(--color-neon-cyan)] hover:scale-[1.02] hover:shadow-[0_0_40px_-2px_var(--color-neon-cyan)]`
            }
          >
            {lockedToday && !result?.valid ? (
              <>
                <Check className="size-4" aria-hidden="true" />
                Este objetivo ya validado hoy
              </>
            ) : result?.valid ? (
              <>
                <Camera className="size-4" aria-hidden="true" />
                Validar día {currentDay}
              </>
            ) : (
              <>
                <Camera className="size-4" aria-hidden="true" />
                Capturar foto
              </>
            )}
          </button>
        </div>
      </section>

      <CaptureModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        challenge={{
          title: challenge.title,
          description: challenge.description,
          day: challenge.day,
          categoryId: CATEGORY_ID,
          objective: categoryMeta.title,
          maintenance,
        }}
      />
    </div>
  )
}
