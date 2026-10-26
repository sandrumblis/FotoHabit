'use client'

import { useEffect, useId } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import { useNetwork } from './network-context'
import type { CommunityUser } from '@/lib/community-data'
import { cn } from '@/lib/utils'

export type ConnectionsMode = 'network'

type CommunityConnectionsModalProps = {
  open: boolean
  mode?: ConnectionsMode
  user: CommunityUser | null
  onClose: () => void
  onSelectUser: (userId: string) => void
}

export function CommunityConnectionsModal({
  open,
  user,
  onClose,
  onSelectUser,
}: CommunityConnectionsModalProps) {
  const titleId = useId()
  const { snapshot, loading } = useNetwork()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !user) return null

  const peers = snapshot.accepted.map((c) => c.peer)
  const isSelf = Boolean(user.isSelf)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200"
    >
      <header className="shrink-0 border-b border-white/5 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              'border border-white/10 bg-card/60 text-foreground',
              'transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan',
            )}
            aria-label="Cerrar"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
              Conexiones mutuas
            </p>
            <h1 id={titleId} className="truncate text-lg font-semibold text-foreground">
              Mi Red{isSelf ? '' : ` · ${user.name}`}
            </h1>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            {peers.length}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-2 px-4 py-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
          {!isSelf ? (
            <p className="mb-2 rounded-2xl border border-white/10 bg-card/40 px-3 py-2 text-xs text-muted-foreground">
              Por privacidad, solo puedes ver tu propia red de conexiones aceptadas.
            </p>
          ) : null}

          {loading && peers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : !isSelf ? null : peers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-muted-foreground">
              Aún no tienes conexiones en Mi Red.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {peers.map((peer) => (
                <li key={peer.id}>
                  <button
                    type="button"
                    onClick={() => onSelectUser(peer.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-card/50 px-3 py-2.5 text-left transition hover:border-neon-cyan/40"
                  >
                    <CommunityAvatar
                      initials={peer.initials}
                      src={peer.avatarUrl}
                      accent={peer.accent}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {peer.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Conexión aceptada
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
