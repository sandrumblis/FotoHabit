'use client'

import { useCallback, useMemo, useState } from 'react'
import { Flame, MessageCircle } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import { CommunityFireButton } from './community-fire-button'
import { CommunityProfileBanner, type ProfileMetricKey } from './community-profile-banner'
import { CommunityProfileModal } from './community-profile-modal'
import {
  CommunityConnectionsModal,
  type ConnectionsMode,
} from './community-connections-modal'
import {
  ACCENT_STYLES,
  getCurrentUser,
  getFeedPosts,
  getUser,
  type CommunityUser,
} from '@/lib/community-data'
import { formatCommunityLevelLine, getLevelFromCompleted } from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

export function CommunityFeed() {
  const me = getCurrentUser()
  const feedBase = useMemo(() => getFeedPosts(), [])

  const [firedIds, setFiredIds] = useState<Set<string>>(() => new Set())
  const [profileUser, setProfileUser] = useState<CommunityUser | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [connectionsOpen, setConnectionsOpen] = useState(false)
  const [connectionsMode, setConnectionsMode] = useState<ConnectionsMode>('followers')
  const [connectionsOwner, setConnectionsOwner] = useState<CommunityUser | null>(null)

  const openProfile = useCallback((user: CommunityUser) => {
    setProfileUser(user)
    setProfileOpen(true)
  }, [])

  const openProfileById = useCallback(
    (userId: string) => {
      const user = getUser(userId)
      if (!user) return
      setConnectionsOpen(false)
      openProfile(user)
    },
    [openProfile],
  )

  const openConnections = useCallback((owner: CommunityUser, mode: ConnectionsMode) => {
    setConnectionsOwner(owner)
    setConnectionsMode(mode)
    setConnectionsOpen(true)
  }, [])

  const toggleFire = useCallback((postId: string) => {
    setFiredIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }, [])

  const handleMetricClick = useCallback(
    (metric: ProfileMetricKey) => {
      if (metric === 'followers') {
        openConnections(me, 'followers')
        return
      }
      if (metric === 'following') {
        openConnections(me, 'following')
        return
      }
      // Publicaciones / Fuegos → perfil propio con grid
      openProfile(me)
    },
    [me, openConnections, openProfile],
  )

  return (
    <section aria-labelledby="feed-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan">Feed social</p>
        <h1 id="feed-title" className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Comunidad
        </h1>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">
          Pruebas publicadas por tus seguidores. Inspírate, celebra rachas y mantén el ritmo.
        </p>
      </div>

      <CommunityProfileBanner
        user={me}
        onMetricClick={handleMetricClick}
        onOpenProfile={() => openProfile(me)}
      />

      <ul className="flex flex-col gap-4">
        {feedBase.map((post) => {
          const author = getUser(post.userId)
          if (!author) return null
          const styles = ACCENT_STYLES[post.accent]
          const fired = firedIds.has(post.id)
          const fireCount = post.likes + (fired ? 1 : 0)

          return (
            <li
              key={post.id}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-card transition-shadow duration-300 hover:shadow-[0_0_40px_-18px_rgba(34,211,238,0.35)]"
            >
              <div
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-gradient-to-br to-transparent blur-2xl',
                  styles.glow,
                )}
              />

              <div className="relative flex items-center gap-3 border-b border-white/5 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => openProfile(author)}
                  className="rounded-full transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
                  aria-label={`Ver perfil de ${author.name}`}
                >
                  <CommunityAvatar
                    initials={author.initials}
                    src={author.avatarUrl}
                    accent={author.accent}
                    size="sm"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => openProfile(author)}
                  className="min-w-0 flex-1 text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {author.name}
                    <span className="ml-1.5 font-mono text-[10px] font-normal text-neon-yellow">
                      · Nivel {getLevelFromCompleted(author.streak)}
                    </span>
                  </p>
                  <p className={cn('truncate font-mono text-[11px]', styles.text)}>
                    {formatCommunityLevelLine(author.primaryHabit, author.streak)} 🔥
                  </p>
                </button>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-neon-yellow">
                  <Flame className="size-3 fill-neon-yellow" aria-hidden="true" />
                  {author.streak}d
                </span>
              </div>

              <div className="relative aspect-[16/10] bg-background/80">
                <div
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br via-transparent to-neon-purple/10',
                    styles.glow,
                  )}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full border border-white/10 bg-background/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur-md">
                    Prueba validada
                  </span>
                </div>
              </div>

              <div className="relative flex flex-col gap-3 px-4 py-4 sm:px-5">
                <p className="text-sm leading-relaxed text-foreground">{post.caption}</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <CommunityFireButton
                      count={fireCount}
                      active={fired}
                      onToggle={() => toggleFire(post.id)}
                    />
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                      Comentar
                    </span>
                  </div>
                  <time className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {post.time}
                  </time>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <CommunityProfileModal
        open={profileOpen}
        user={profileUser}
        onClose={() => setProfileOpen(false)}
        onOpenFollowers={() => {
          if (!profileUser) return
          openConnections(profileUser, 'followers')
        }}
        onOpenFollowing={() => {
          if (!profileUser) return
          openConnections(profileUser, 'following')
        }}
      />

      <CommunityConnectionsModal
        open={connectionsOpen}
        mode={connectionsMode}
        user={connectionsOwner}
        onClose={() => setConnectionsOpen(false)}
        onSelectUser={openProfileById}
      />
    </section>
  )
}
