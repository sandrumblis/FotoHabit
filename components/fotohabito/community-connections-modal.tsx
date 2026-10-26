'use client'

import { useEffect, useId } from 'react'
import { Flame, X } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import {
  ACCENT_STYLES,
  getUsersByIds,
  type CommunityUser,
} from '@/lib/community-data'
import { cn } from '@/lib/utils'

export type ConnectionsMode = 'followers' | 'following'

type CommunityConnectionsModalProps = {
  open: boolean
  mode: ConnectionsMode
  user: CommunityUser | null
  onClose: () => void
  onSelectUser: (userId: string) => void
}

export function CommunityConnectionsModal({
  open,
  mode,
  user,
  onClose,
  onSelectUser,
}: CommunityConnectionsModalProps) {
  const titleId = useId()

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

  const ids = mode === 'followers' ? user.followerIds : user.followingIds
  const people = getUsersByIds(ids)
  const title = mode === 'followers' ? 'Seguidores' : 'Seguidos'
  const styles = ACCENT_STYLES[user.accent]

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center p-3 sm:items-center sm:p-4">
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
          'relative z-10 flex max-h-[min(86dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border bg-card',
          styles.border,
          styles.ring,
          'animate-in fade-in slide-in-from-bottom-4 duration-300 sm:zoom-in-95',
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-neon-cyan via-neon-lime to-neon-purple"
        />

        <div className="relative flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {user.name}
            </p>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
              {title}
              <span className={cn('ml-2 font-mono text-sm', styles.text)}>{people.length}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Cerrar ${title.toLowerCase()}`}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <ul className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {people.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-muted-foreground">
              No hay nadie en esta lista todavía.
            </li>
          ) : (
            people.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => onSelectUser(person.id)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-all duration-300 hover:border-white/10 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
                >
                  <CommunityAvatar
                    initials={person.initials}
                    accent={person.accent}
                    size="md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-neon-cyan">
                      {person.name}
                    </span>
                    <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {person.bio}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-neon-yellow">
                    <Flame className="size-3" aria-hidden="true" />
                    {person.streak}d
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
