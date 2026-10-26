'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Flag, MoreHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type FeedContentMenuProps = {
  canDelete: boolean
  onDelete?: () => void | Promise<void>
  onReport: () => void | Promise<void>
  deleteLabel?: string
  reportLabel?: string
  className?: string
}

export function FeedContentMenu({
  canDelete,
  onDelete,
  onReport,
  deleteLabel = 'Eliminar',
  reportLabel = 'Reportar',
  className,
}: FeedContentMenuProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  async function run(action: () => void | Promise<void>) {
    setBusy(true)
    try {
      await action()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-50"
        aria-label="Más opciones"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-9 z-20 min-w-[10.5rem] overflow-hidden rounded-2xl border border-white/10 bg-card py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)]"
        >
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void run(onReport)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-white/5 disabled:opacity-50"
          >
            <Flag className="size-3.5 text-neon-yellow" aria-hidden="true" />
            {reportLabel}
          </button>
          {canDelete && onDelete ? (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => void run(onDelete)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {deleteLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
