'use client'

import { useEffect, useId } from 'react'
import { ArrowLeft, Flame, Images, UserPlus, Users } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import { CommunityFireButton } from './community-fire-button'
import { EditableProfileBio } from './editable-profile-bio'
import {
  ACCENT_STYLES,
  getPostsByUser,
  type CommunityPost,
  type CommunityUser,
} from '@/lib/community-data'
import { formatCommunityLevelLine, getLevelFromCompleted } from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

type CommunityProfileModalProps = {
  open: boolean
  user: CommunityUser | null
  onClose: () => void
  onOpenFollowers: () => void
  onOpenFollowing: () => void
  postsOverride?: CommunityPost[]
}

export function CommunityProfileModal({
  open,
  user,
  onClose,
  onOpenFollowers,
  onOpenFollowing,
  postsOverride,
}: CommunityProfileModalProps) {
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

  const styles = ACCENT_STYLES[user.accent]
  const posts = postsOverride ?? getPostsByUser(user.id)
  const level = getLevelFromCompleted(user.streak)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[55] flex flex-col bg-background animate-in fade-in duration-300"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -right-24 -top-20 size-72 rounded-full bg-gradient-to-br blur-3xl opacity-50',
            styles.glow,
          )}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
      </div>

      <header className="relative z-10 shrink-0 border-b border-white/5 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-start gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
              'border border-white/10 bg-card/60 text-foreground backdrop-blur-md',
              'transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
            )}
            aria-label="Volver"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <p className={cn('font-mono text-[10px] uppercase tracking-[0.2em]', styles.text)}>
              {user.isSelf ? 'Tu perfil' : 'Perfil'}
            </p>
            <h1 id={titleId} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {user.name}
            </h1>
          </div>
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-start gap-4">
            <CommunityAvatar
              initials={user.initials}
              src={user.avatarUrl}
              accent={user.accent}
              size="xl"
            />
            <div className="min-w-0 flex-1 pt-1">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-neon-yellow">
                <Flame className="size-3 fill-neon-yellow" aria-hidden="true" />
                Nivel {level} · {user.streak} días de racha
              </span>
              <p className="mt-1 font-mono text-[11px] text-neon-cyan">
                {formatCommunityLevelLine(user.primaryHabit, user.streak)} 🔥
              </p>
              <EditableProfileBio
                editable={Boolean(user.isSelf)}
                fallbackBio={user.bio}
                className="mt-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatChip
              icon={Images}
              value={posts.length || user.postsCount}
              label="Posts"
              className="text-neon-purple"
            />
            <button
              type="button"
              onClick={onOpenFollowers}
              className="rounded-2xl transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              <StatChip
                icon={Users}
                value={user.followersCount}
                label="Seguidores"
                className="text-neon-cyan"
                interactive
              />
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="rounded-2xl transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              <StatChip
                icon={UserPlus}
                value={user.followingCount}
                label="Seguidos"
                className="text-neon-lime"
                interactive
              />
            </button>
            <StatChip
              icon={Flame}
              value={user.likesCount}
              label="Fuegos"
              className="text-neon-yellow"
            />
          </div>

          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Publicaciones
            </h2>
            {posts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-muted-foreground">
                Todavía no hay publicaciones visibles.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {posts.map((post) => {
                  const postStyles = ACCENT_STYLES[post.accent]
                  const img = post.previewUrl || post.imageUrl
                  return (
                    <li
                      key={post.id}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-background/60',
                        postStyles.ring,
                      )}
                    >
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={post.habit}
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className={cn(
                            'absolute inset-0 bg-gradient-to-br via-transparent to-neon-purple/15',
                            postStyles.glow,
                          )}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
                      <div className="absolute inset-0 flex flex-col justify-between p-2.5">
                        <span
                          className={cn(
                            'self-start rounded-full border border-white/15 bg-background/75 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider backdrop-blur-md',
                            postStyles.text,
                          )}
                        >
                          {post.habit}
                        </span>
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-[11px] leading-snug text-white/90">
                            {post.caption}
                          </p>
                          <CommunityFireButton count={post.likes} size="sm" readOnly />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function StatChip({
  icon: Icon,
  value,
  label,
  className,
  interactive,
}: {
  icon: typeof Images
  value: number
  label: string
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-card/70 px-1.5 py-2.5',
        interactive && 'hover:border-white/20',
        className,
      )}
    >
      <Icon className="size-3.5 opacity-90" aria-hidden="true" />
      <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
      <span className="text-center font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
