'use client'

import { useEffect, useId } from 'react'
import { Scale, X } from 'lucide-react'
import { LEGAL_DOCS, type LegalDocId } from '@/lib/legal-content'
import { cn } from '@/lib/utils'

type LegalModalProps = {
  doc: LegalDocId | null
  onClose: () => void
}

export function LegalModal({ doc, onClose }: LegalModalProps) {
  const titleId = useId()
  const content = doc ? LEGAL_DOCS[doc] : null

  useEffect(() => {
    if (!doc) return
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
  }, [doc, onClose])

  if (!content) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden',
          'rounded-3xl border border-white/10 bg-card shadow-[0_0_50px_-16px_rgba(0,240,255,0.3)]',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
              <Scale className="size-3" aria-hidden="true" />
              Legal
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold text-foreground">
              {content.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Actualizado: {content.updated}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
