'use client'

import { useRef, useState } from 'react'
import { Camera, Check } from 'lucide-react'

export function CaptureBanner() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <section
      aria-labelledby="capture-title"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-card p-5 sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-neon-cyan via-neon-lime via-60% to-neon-purple"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-neon-cyan/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan">
            Reto de hoy · Día 13
          </span>
          <h2 id="capture-title" className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {fileName ? '¡Prueba registrada!' : 'Captura la foto del día'}
          </h2>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            {fileName
              ? 'Tu foto está lista para validar. Mantén la racha mañana.'
              : 'Haz 20 minutos de actividad física y sube una foto como prueba para mantener tu racha.'}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={
            fileName
              ? 'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-neon-lime/60 bg-neon-lime/10 px-6 text-sm font-semibold text-neon-lime shadow-[0_0_24px_-6px_var(--color-neon-lime)] transition-all'
              : 'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-neon-cyan px-6 text-sm font-semibold text-background shadow-[0_0_32px_-4px_var(--color-neon-cyan)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_-2px_var(--color-neon-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          }
        >
          {fileName ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Cambiar foto
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
  )
}
