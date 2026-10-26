'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LegalModal } from './legal-modal'
import type { LegalDocId } from '@/lib/legal-content'

type AppFooterProps = {
  /** Si true, abre modales en la app; si false, usa rutas /privacidad y /terminos. */
  useModal?: boolean
  className?: string
}

export function AppFooter({ useModal = true, className }: AppFooterProps) {
  const [doc, setDoc] = useState<LegalDocId | null>(null)

  return (
    <>
      <footer
        className={
          className ??
          'mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pb-8 pt-2 text-center sm:max-w-3xl sm:px-6'
        }
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
          © {new Date().getFullYear()} FotoHabit
        </span>
        {useModal ? (
          <>
            <button
              type="button"
              onClick={() => setDoc('privacy')}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-neon-cyan hover:underline"
            >
              Política de Privacidad
            </button>
            <button
              type="button"
              onClick={() => setDoc('terms')}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-neon-cyan hover:underline"
            >
              Términos de Uso
            </button>
          </>
        ) : (
          <>
            <Link
              href="/privacidad"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-neon-cyan hover:underline"
            >
              Política de Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-neon-cyan hover:underline"
            >
              Términos de Uso
            </Link>
          </>
        )}
      </footer>
      {useModal ? <LegalModal doc={doc} onClose={() => setDoc(null)} /> : null}
    </>
  )
}
