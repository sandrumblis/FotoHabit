'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flame, MessageCircle, Sparkles } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import { CommunityFireButton } from './community-fire-button'
import { CommunityProfileBanner, type ProfileMetricKey } from './community-profile-banner'
import { CommunityProfileModal } from './community-profile-modal'
import { CommunityConnectionsModal } from './community-connections-modal'
import { FeedContentMenu } from './feed-content-menu'
import { NetworkPanel } from './network-panel'
import { ObjectivesStoriesBar } from './objectives-stories-bar'
import { useAuth } from './auth-context'
import { useExploreObjectives } from './explore-objectives-context'
import { ExploreObjectivesModal } from './explore-objectives-modal'
import { useKorePro } from './kore-pro-context'
import { useNetwork } from './network-context'
import { useProfileSettings } from './profile-settings-context'
import { HabitChallengeModal } from './habit-challenge-modal'
import {
  HabitCelebrationModal,
  type CelebrationKind,
} from './habit-celebration-modal'
import {
  CaptureModal,
  type CaptureChallengeContext,
  type CaptureResult,
} from './capture-modal'
import { useHabitProgress } from './habit-progress-context'
import { useSocialFeed } from './social-feed-context'
import {
  ACCENT_STYLES,
  getCurrentUser,
  getUser,
  HABIT_MOTTO,
  habitAccentFromCategory,
  type CommunityPost,
  type CommunityUser,
} from '@/lib/community-data'
import {
  getCategoryMeta,
  getChallenge,
  getCurrentDay,
  type HabitCategoryId,
} from '@/lib/habit-challenges'
import {
  getLevelForDay,
  getLevelFromCompleted,
  getLevelMeta,
  isHabitCreatedMilestone,
  isLevelMilestoneDay,
  isMaintenanceDay,
  formatCommunityLevelLine,
} from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

const PRIMARY_HABIT: HabitCategoryId = 'actividad-fisica'

type CommunityTab = 'global' | 'network' | 'profile'

type CelebrationState = {
  kind: CelebrationKind
  level: number
  day: number
  categoryId: HabitCategoryId
  photoUrl?: string | null
}

const COMMUNITY_TABS: Array<{ id: CommunityTab; label: string }> = [
  { id: 'global', label: 'Feed Global' },
  { id: 'network', label: 'Mi Red' },
  { id: 'profile', label: 'Mi Perfil' },
]

export function HomeSocial() {
  const { user: authUser } = useAuth()
  const {
    displayName,
    avatarUrl,
    initials,
    openSettings,
    profileRevision,
  } = useProfileSettings()
  const mockMe = getCurrentUser()
  const { connectedIds, snapshot: networkSnapshot, incomingCount } = useNetwork()
  const me = useMemo((): CommunityUser => {
    if (!authUser) return mockMe
    // Perfil real limpio: sin rachas inventadas del mock de comunidad.
    return {
      ...mockMe,
      id: authUser.id,
      name: displayName || authUser.name || mockMe.name,
      initials: initials || 'FH',
      avatarUrl: avatarUrl,
      bio: '',
      streak: 0,
      primaryHabit: 'Elige tu primer hábito',
      postsCount: 0,
      followersCount: networkSnapshot.accepted.length,
      followingCount: networkSnapshot.accepted.length,
      likesCount: 0,
      followerIds: networkSnapshot.connectedIds,
      followingIds: networkSnapshot.connectedIds,
      isSelf: true,
    }
  }, [
    authUser,
    mockMe,
    displayName,
    avatarUrl,
    initials,
    profileRevision,
    networkSnapshot.accepted.length,
    networkSnapshot.connectedIds,
  ])

  const {
    getCompleted,
    completeDay,
    canValidateToday,
    dailyValidationMessage,
    isTodayValidated,
    activeCategoryIds,
    deactivateCategory,
  } = useHabitProgress()
  const {
    posts,
    publishPost,
    deletePost,
    deleteComment,
    reportPost,
    reportComment,
    getPostsByUserId,
    loading,
    error,
    refreshFeed,
  } = useSocialFeed()

  // Tras editar nombre/avatar, refrescar autores del feed.
  useEffect(() => {
    if (profileRevision <= 0) return
    void refreshFeed()
  }, [profileRevision, refreshFeed])

  const primaryId = activeCategoryIds[0] ?? PRIMARY_HABIT
  const primaryCompleted = getCompleted(primaryId)
  const profileOverrides = useMemo(
    () => ({
      streak: primaryCompleted,
      primaryHabit:
        activeCategoryIds.length > 0
          ? getCategoryMeta(primaryId).title
          : 'Elige tu primer hábito',
      postsCount: getPostsByUserId(me.id).length,
      networkCount: networkSnapshot.accepted.length,
      likesCount: posts.filter((p) => p.userId === me.id && p.neonFire).length,
    }),
    [
      primaryCompleted,
      primaryId,
      activeCategoryIds.length,
      getPostsByUserId,
      me.id,
      posts,
      networkSnapshot.accepted.length,
    ],
  )

  const [communityTab, setCommunityTab] = useState<CommunityTab>('global')
  const [firedIds, setFiredIds] = useState<Set<string>>(() => new Set())
  const [profileUser, setProfileUser] = useState<CommunityUser | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [connectionsOpen, setConnectionsOpen] = useState(false)
  const [connectionsOwner, setConnectionsOwner] = useState<CommunityUser | null>(null)

  const [roadmapCategory, setRoadmapCategory] = useState<HabitCategoryId | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureChallenge, setCaptureChallenge] = useState<CaptureChallengeContext | null>(null)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const { isAddGoalOpen, openAddGoal, closeAddGoal } = useExploreObjectives()
  const { isPro, openProModal } = useKorePro()

  const openProfile = useCallback((user: CommunityUser) => {
    setProfileUser(user)
    setProfileOpen(true)
  }, [])

  const openProfileById = useCallback(
    (userId: string) => {
      const fromNetwork = networkSnapshot.accepted.find((c) => c.peer.id === userId)?.peer
      const user = fromNetwork ?? getUser(userId)
      if (!user) return
      setConnectionsOpen(false)
      openProfile(user)
    },
    [openProfile, networkSnapshot.accepted],
  )

  const openConnections = useCallback((owner: CommunityUser) => {
    setConnectionsOwner(owner)
    setConnectionsOpen(true)
  }, [])

  const handleMetricClick = useCallback(
    (metric: ProfileMetricKey) => {
      if (metric === 'network') {
        openConnections(me)
        return
      }
      openProfile({ ...me, ...profileOverrides })
    },
    [me, openConnections, openProfile, profileOverrides],
  )

  const toggleFire = useCallback((postId: string) => {
    setFiredIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }, [])

  function openCaptureForCategory(categoryId: HabitCategoryId) {
    if (!canValidateToday(categoryId)) {
      setToast(dailyValidationMessage)
      window.setTimeout(() => setToast(null), 5600)
      return
    }
    const completed = getCompleted(categoryId)
    const day = getCurrentDay(completed)
    const challenge = getChallenge(categoryId, day)
    const categoryMeta = getCategoryMeta(categoryId)
    setCaptureChallenge({
      title: challenge.title,
      description: challenge.description,
      day: challenge.day,
      categoryId,
      objective: categoryMeta.title,
      maintenance: isMaintenanceDay(day),
    })
    setCaptureOpen(true)
  }

  async function handleValidated(result: CaptureResult) {
    if (!result.valid || !result.categoryId) return
    const categoryId = result.categoryId as HabitCategoryId
    const completion = completeDay(categoryId, { isPro })
    if (!completion.ok) {
      setToast(completion.message)
      setCaptureChallenge(null)
      window.setTimeout(() => setToast(null), 5600)
      return
    }
    const next = completion.next
    const level = getLevelFromCompleted(next)
    const categoryMeta = getCategoryMeta(categoryId)
    const day = result.day ?? next
    void day
    const visibility =
      result.privacy === 'network' ? 'network' : 'global'

    let welcomeApplied = false
    // Solo publica tras el modal de personalización (caption + visibilidad).
    try {
      const published = await publishPost({
        habit: categoryMeta.title,
        accent: habitAccentFromCategory(categoryId),
        caption:
          result.caption ||
          result.message ||
          `${categoryMeta.title} · Día ${next} validado`,
        visibility,
        level,
        streakDays: next,
        previewUrl: result.previewUrl,
        imageFile: result.imageFile ?? null,
        categoryId,
      })
      welcomeApplied = published.welcomeApplied
    } catch (err) {
      setToast(
        err instanceof Error
          ? `Foto validada, pero no se pudo publicar: ${err.message}`
          : 'Foto validada, pero no se pudo publicar en la comunidad.',
      )
      setCaptureChallenge(null)
      window.setTimeout(() => setToast(null), 6200)
      return
    }

    setToast(
      welcomeApplied
        ? `${result.message} La comunidad te ha recibido con 🔥🔥 y mensajes de ánimo.`
        : result.message,
    )
    setCaptureChallenge(null)

    if (isHabitCreatedMilestone(next)) {
      setCelebration({
        kind: 'habit-created',
        level: getLevelForDay(next),
        day: next,
        categoryId,
        photoUrl: result.previewUrl,
      })
    } else if (isLevelMilestoneDay(next)) {
      setCelebration({
        kind: 'level-up',
        level: getLevelForDay(next),
        day: next,
        categoryId,
        photoUrl: result.previewUrl,
      })
    }

    window.setTimeout(() => setToast(null), 5200)
  }

  function closeCelebration() {
    const cat = celebration?.categoryId
    setCelebration(null)
    if (cat) setRoadmapCategory(cat)
  }

  const profileForModal =
    profileUser?.id === me.id ? { ...me, ...profileOverrides } : profileUser

  const feedPosts = useMemo(() => {
    const isNetworkVis = (v: CommunityPost['visibility']) =>
      v === 'network' || v === 'private'
    const isGlobalVis = (v: CommunityPost['visibility']) =>
      !v || v === 'global' || v === 'public'

    if (communityTab === 'network') {
      return posts.filter(
        (p) =>
          isNetworkVis(p.visibility) &&
          (p.userId === me.id || connectedIds.has(p.userId)),
      )
    }
    if (communityTab === 'profile') {
      return posts.filter((p) => p.userId === me.id)
    }
    return posts.filter((p) => isGlobalVis(p.visibility))
  }, [communityTab, posts, me.id, connectedIds])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan">
          Red de crecimiento
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Comunidad
        </h1>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">
          Inspírate con las pruebas reales de la comunidad y mantén tu disciplina diaria.
        </p>
        <p
          className="mt-1 inline-flex w-fit items-center rounded-full border border-neon-fuchsia/40 bg-neon-fuchsia/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neon-fuchsia shadow-[0_0_20px_-8px_var(--color-neon-fuchsia)]"
          role="note"
        >
          {HABIT_MOTTO}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Secciones de comunidad"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-card/60 p-1"
      >
        {COMMUNITY_TABS.map((tab) => {
          const active = communityTab === tab.id
          const showBadge = tab.id === 'network' && incomingCount > 0
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCommunityTab(tab.id)}
              className={cn(
                'relative h-10 rounded-xl px-2 text-xs font-semibold transition-all sm:text-sm',
                active
                  ? 'bg-neon-cyan/15 text-neon-cyan shadow-[0_0_18px_-8px_var(--color-neon-cyan)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {showBadge ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-neon-yellow font-mono text-[9px] font-bold text-background"
                  aria-label={`${incomingCount} solicitudes pendientes`}
                >
                  {incomingCount > 9 ? '9+' : incomingCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {toast ? (
        <div
          role="status"
          className="rounded-2xl border border-neon-lime/40 bg-neon-lime/10 px-4 py-3 text-sm leading-relaxed text-neon-lime shadow-[0_0_28px_-10px_var(--color-neon-lime)]"
        >
          {toast}
        </div>
      ) : null}

      {communityTab === 'profile' ? (
        <CommunityProfileBanner
          user={me}
          overrides={profileOverrides}
          onMetricClick={handleMetricClick}
          onOpenProfile={() => openProfile({ ...me, ...profileOverrides })}
          onEditProfile={openSettings}
        />
      ) : null}

      {communityTab === 'network' ? (
        <NetworkPanel onSelectUser={openProfile} />
      ) : null}

      <ObjectivesStoriesBar
        onSelect={(categoryId) => setRoadmapCategory(categoryId)}
        onAddGoalClick={openAddGoal}
      />

      <ExploreObjectivesModal
        open={isAddGoalOpen}
        onClose={closeAddGoal}
        onSelectObjective={(categoryId) => setRoadmapCategory(categoryId)}
        onUnlockPro={(title, description, reason) => {
          closeAddGoal()
          openProModal({ title, description, reason })
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {communityTab === 'global'
            ? 'Pruebas de toda la comunidad'
            : communityTab === 'network'
              ? 'Solo conexiones mutuas aceptadas'
              : 'Tus pruebas publicadas'}
        </p>
        <span className="font-mono text-[10px] text-white/40">{feedPosts.length}</span>
      </div>

      {loading ? (
        <p className="rounded-3xl border border-white/10 px-4 py-10 text-center font-mono text-xs text-muted-foreground">
          Cargando comunidad…
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-neon-fuchsia/40 bg-neon-fuchsia/10 px-4 py-3 text-sm text-neon-fuchsia">
          {error}
        </p>
      ) : null}

      {!loading && feedPosts.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-muted-foreground">
          {communityTab === 'network'
            ? connectedIds.size === 0
              ? 'Cuando aceptéis una conexión mutua, sus publicaciones aparecerán aquí.'
              : 'Tus conexiones aún no han publicado pruebas.'
            : communityTab === 'profile'
              ? 'Valida un hábito con foto y compártelo para verlo aquí.'
              : 'El feed está vacío por ahora. ¡Sé el primero en publicar!'}
        </p>
      ) : null}

      {!loading && feedPosts.length > 0 ? (
        <ul className="flex flex-col gap-5">
          {feedPosts.map((post) => {
            const rawAuthor =
              post.author ??
              (post.userId === me.id ? me : getUser(post.userId))
            if (!rawAuthor) return null
            const author =
              rawAuthor.id === me.id
                ? {
                    ...rawAuthor,
                    ...me,
                    name: me.name,
                    initials: me.initials,
                    avatarUrl: me.avatarUrl,
                  }
                : rawAuthor
            const styles = ACCENT_STYLES[post.accent]
            const fired =
              firedIds.has(post.id) || Boolean(post.neonFire && post.userId === me.id)
            const fireCount = post.likes + (firedIds.has(post.id) ? 1 : 0)
            const streak = post.streakDays ?? author.streak
            const level = post.level ?? getLevelFromCompleted(streak)
            const photo = post.previewUrl || post.imageUrl

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
                    onClick={() =>
                      openProfile(
                        author.id === me.id ? { ...me, ...profileOverrides } : author,
                      )
                    }
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
                    onClick={() =>
                      openProfile(
                        author.id === me.id ? { ...me, ...profileOverrides } : author,
                      )
                    }
                    className="min-w-0 flex-1 text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {author.name}
                      <span className="ml-1.5 font-mono text-[10px] font-normal text-neon-yellow">
                        · Nivel {level}
                      </span>
                    </p>
                    <p className={cn('truncate font-mono text-[11px]', styles.text)}>
                      {formatCommunityLevelLine(post.habit, streak)} 🔥
                    </p>
                  </button>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-neon-yellow/40 bg-neon-yellow/10 px-2 py-0.5 font-mono text-[10px] text-neon-yellow">
                      <Flame className="size-3 fill-neon-yellow" aria-hidden="true" />
                      {streak}d racha
                    </span>
                    <FeedContentMenu
                      canDelete={post.userId === me.id}
                      deleteLabel="Eliminar foto"
                      reportLabel="Reportar foto"
                      onDelete={async () => {
                        if (
                          !window.confirm(
                            '¿Eliminar esta foto del feed? Esta acción no se puede deshacer.',
                          )
                        ) {
                          return
                        }
                        try {
                          await deletePost(post.id)
                          setToast('Publicación eliminada')
                          window.setTimeout(() => setToast(null), 3200)
                        } catch (err) {
                          setToast(
                            err instanceof Error
                              ? err.message
                              : 'No se pudo eliminar la publicación',
                          )
                          window.setTimeout(() => setToast(null), 4500)
                        }
                      }}
                      onReport={async () => {
                        try {
                          await reportPost(post.id)
                          setToast('Gracias. Hemos recibido tu reporte.')
                          window.setTimeout(() => setToast(null), 3600)
                        } catch (err) {
                          setToast(
                            err instanceof Error
                              ? err.message
                              : 'No se pudo enviar el reporte',
                          )
                          window.setTimeout(() => setToast(null), 4500)
                        }
                      }}
                    />
                  </span>
                </div>

                <div className="relative aspect-[4/5] max-h-[min(72vh,560px)] bg-background/80 sm:aspect-[16/10] sm:max-h-none">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={`Prueba validada de ${post.habit}`}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <>
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
                    </>
                  )}

                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider backdrop-blur-md',
                        'border-white/15 bg-background/80',
                        styles.text,
                      )}
                    >
                      {post.habit}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-neon-lime/40 bg-background/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-neon-lime backdrop-blur-md">
                      <Sparkles className="size-2.5" aria-hidden="true" />
                      IA
                    </span>
                  </div>

                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-neon-yellow/50 bg-background/85 px-2.5 py-1 font-mono text-[10px] text-neon-yellow shadow-[0_0_20px_-4px_var(--color-neon-yellow)] backdrop-blur-md">
                    <Flame className="size-3 fill-neon-yellow" aria-hidden="true" />
                    Nv.{level} · {streak}d
                  </span>
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
                        {post.comments?.length ? post.comments.length : 'Comentar'}
                      </span>
                    </div>
                    <time className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {post.time}
                    </time>
                  </div>

                  {post.comments && post.comments.length > 0 ? (
                    <ul className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-background/40 px-3 py-2.5">
                      {post.comments.map((comment) => {
                        const commenter = getUser(comment.userId)
                        const isOwnComment = comment.userId === me.id
                        return (
                          <li
                            key={comment.id}
                            className="flex items-start gap-2 text-xs leading-relaxed"
                          >
                            <span
                              className={cn(
                                'shrink-0 font-semibold',
                                comment.welcome ? 'text-neon-purple' : 'text-neon-cyan',
                              )}
                            >
                              {commenter?.name ?? 'Comunidad'}
                              {commenter?.isBot ? ' · Bot' : ''}
                            </span>
                            <span className="min-w-0 flex-1 text-muted-foreground">
                              {comment.text}
                            </span>
                            <FeedContentMenu
                              canDelete={isOwnComment}
                              deleteLabel="Eliminar comentario"
                              reportLabel="Reportar comentario"
                              onDelete={async () => {
                                if (!window.confirm('¿Eliminar este comentario?')) return
                                try {
                                  await deleteComment(post.id, comment.id)
                                  setToast('Comentario eliminado')
                                  window.setTimeout(() => setToast(null), 2800)
                                } catch (err) {
                                  setToast(
                                    err instanceof Error
                                      ? err.message
                                      : 'No se pudo eliminar el comentario',
                                  )
                                  window.setTimeout(() => setToast(null), 4500)
                                }
                              }}
                              onReport={async () => {
                                try {
                                  await reportComment(comment.id)
                                  setToast('Gracias. Hemos recibido tu reporte.')
                                  window.setTimeout(() => setToast(null), 3600)
                                } catch (err) {
                                  setToast(
                                    err instanceof Error
                                      ? err.message
                                      : 'No se pudo enviar el reporte',
                                  )
                                  window.setTimeout(() => setToast(null), 4500)
                                }
                              }}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      <CommunityProfileModal
        open={profileOpen}
        user={profileForModal}
        networkCount={
          profileForModal?.isSelf ? networkSnapshot.accepted.length : undefined
        }
        postsOverride={
          profileForModal ? getPostsByUserId(profileForModal.id) : undefined
        }
        onClose={() => setProfileOpen(false)}
        onOpenNetwork={() => {
          if (!profileForModal) return
          openConnections(profileForModal)
        }}
      />

      <CommunityConnectionsModal
        open={connectionsOpen}
        user={connectionsOwner}
        onClose={() => setConnectionsOpen(false)}
        onSelectUser={openProfileById}
      />

      <HabitChallengeModal
        open={roadmapCategory !== null}
        categoryId={roadmapCategory}
        completed={roadmapCategory ? getCompleted(roadmapCategory) : 0}
        dailyLocked={
          roadmapCategory ? isTodayValidated(roadmapCategory) : false
        }
        dailyLockedMessage={dailyValidationMessage}
        onClose={() => setRoadmapCategory(null)}
        onCapture={() => {
          if (!roadmapCategory) return
          if (!canValidateToday(roadmapCategory)) {
            setToast(dailyValidationMessage)
            window.setTimeout(() => setToast(null), 5600)
            return
          }
          const id = roadmapCategory
          setRoadmapCategory(null)
          openCaptureForCategory(id)
        }}
        onDeactivate={(id) => {
          deactivateCategory(id)
          setRoadmapCategory(null)
          setToast('Objetivo quitado de tu lista. Puedes volver a añadirlo cuando quieras.')
          window.setTimeout(() => setToast(null), 4200)
        }}
      />

      <CaptureModal
        open={captureOpen}
        challenge={captureChallenge}
        onClose={() => {
          setCaptureOpen(false)
          setCaptureChallenge(null)
        }}
        onConfirm={handleValidated}
      />

      <HabitCelebrationModal
        open={celebration !== null}
        kind={celebration?.kind ?? null}
        level={celebration?.level ?? 1}
        day={celebration?.day ?? 0}
        categoryTitle={
          celebration
            ? `${getCategoryMeta(celebration.categoryId).title} · ${getLevelMeta(celebration.level).name}`
            : ''
        }
        glowColor={
          celebration ? getCategoryMeta(celebration.categoryId).color : undefined
        }
        photoUrl={celebration?.photoUrl}
        onClose={closeCelebration}
      />
    </div>
  )
}
