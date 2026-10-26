'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './auth-context'
import { createClient } from '@/lib/supabase/client'
import {
  fetchCommunityFeed,
  publishValidatedPhoto,
} from '@/lib/supabase/posts'
import { deleteOwnPost, reportContent } from '@/lib/supabase/moderation'
import type { CommunityPost } from '@/lib/community-data'

type PublishInput = {
  habit: string
  accent: CommunityPost['accent']
  caption: string
  /** global = Feed Global · network = Mi Red */
  visibility?: 'global' | 'network'
  level: number
  streakDays: number
  previewUrl?: string | null
  /** Preferido: File/Blob evita "Failed to fetch" por blob: URL revocada. */
  imageFile?: File | Blob | null
  categoryId?: string
}

type PublishResult = {
  post: CommunityPost
  welcomeApplied: boolean
}

type SocialFeedContextValue = {
  posts: CommunityPost[]
  loading: boolean
  error: string | null
  hasPublishedLive: boolean
  publishPost: (input: PublishInput) => Promise<PublishResult>
  deletePost: (postId: string) => Promise<void>
  deleteComment: (postId: string, commentId: string) => Promise<void>
  reportPost: (postId: string, reason?: string) => Promise<void>
  reportComment: (commentId: string, reason?: string) => Promise<void>
  refreshFeed: () => Promise<void>
  getPostsByUserId: (userId: string) => CommunityPost[]
}

const SocialFeedContext = createContext<SocialFeedContextValue | null>(null)

function friendlyPublishMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'No se pudo publicar en el feed'
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(raw)) {
    return 'No se pudo publicar (conexión o Storage). Comprueba el bucket «posts» en Supabase y tu red, e inténtalo de nuevo.'
  }
  return raw
}

async function publishViaServerApi(input: {
  userId: string
  displayName: string
  habitTitle: string
  categoryKey?: string
  caption: string
  visibility?: 'global' | 'network'
  streakDays: number
  level: number
  image: Blob
}): Promise<CommunityPost> {
  const form = new FormData()
  const file =
    input.image instanceof File
      ? input.image
      : new File([input.image], `fotohabit-${Date.now()}.jpg`, {
          type: input.image.type || 'image/jpeg',
        })
  form.append('image', file)
  form.append('caption', input.caption)
  form.append('visibility', input.visibility ?? 'global')
  form.append('habitTitle', input.habitTitle)
  form.append('displayName', input.displayName)
  form.append('streakDays', String(input.streakDays))
  form.append('level', String(input.level))
  if (input.categoryKey) form.append('categoryKey', input.categoryKey)

  const res = await fetch('/api/publish-post', {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  })

  const raw = await res.text()
  let data: { ok?: boolean; post?: CommunityPost; message?: string } = {}
  try {
    data = raw ? (JSON.parse(raw) as typeof data) : {}
  } catch {
    throw new Error(
      res.ok
        ? 'Respuesta inválida del servidor al publicar'
        : 'No se pudo publicar (respuesta no JSON del servidor)',
    )
  }

  if (!res.ok || !data.ok || !data.post) {
    throw new Error(data.message || `No se pudo publicar (${res.status})`)
  }
  return data.post
}

export function SocialFeedProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPublishedLive, setHasPublishedLive] = useState(false)

  const refreshFeed = useCallback(async () => {
    try {
      const next = await fetchCommunityFeed()
      setPosts(next)
      setError(null)
      if (user?.id) {
        setHasPublishedLive(next.some((p) => p.userId === user.id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el feed')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isAuthenticated) {
      setPosts([])
      setLoading(false)
      return
    }

    setLoading(true)
    void refreshFeed()

    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
    try {
      const supabase = createClient()
      channel = supabase
        .channel('public:posts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts' },
          () => {
            void refreshFeed()
          },
        )
        .subscribe()
    } catch (err) {
      console.warn('[social-feed] realtime skipped', err)
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient()
          void supabase.removeChannel(channel)
        } catch {
          /* noop */
        }
      }
    }
  }, [isAuthenticated, refreshFeed])

  const publishPost = useCallback(
    async (input: PublishInput): Promise<PublishResult> => {
      if (!user) throw new Error('Debes iniciar sesión para publicar')
      const image = input.imageFile ?? input.previewUrl
      if (!image) throw new Error('Falta la foto validada')

      const wasFirst = !hasPublishedLive

      try {
        let post: CommunityPost

        // 1) Preferir API servidor (más fiable en Vercel / evita Failed to fetch de Storage en cliente).
        if (typeof image !== 'string') {
          try {
            post = await publishViaServerApi({
              userId: user.id,
              displayName: user.name,
              habitTitle: input.habit,
              categoryKey: input.categoryId,
              caption: input.caption,
              visibility: input.visibility ?? 'global',
              streakDays: input.streakDays,
              level: input.level,
              image,
            })
          } catch (apiErr) {
            console.warn('[FotoHabit] publish API failed, trying client path', apiErr)
            post = await publishValidatedPhoto({
              userId: user.id,
              displayName: user.name,
              habitTitle: input.habit,
              categoryKey: input.categoryId,
              accent: input.accent,
              caption: input.caption,
              visibility: input.visibility ?? 'global',
              streakDays: input.streakDays,
              level: input.level,
              image,
            })
          }
        } else {
          // data:/blob: — cliente (con mensajes claros si blob revocado).
          post = await publishValidatedPhoto({
            userId: user.id,
            displayName: user.name,
            habitTitle: input.habit,
            categoryKey: input.categoryId,
            accent: input.accent,
            caption: input.caption,
            visibility: input.visibility ?? 'global',
            streakDays: input.streakDays,
            level: input.level,
            image,
          })
        }

        setPosts((prev) => {
          const without = prev.filter((p) => p.id !== post.id)
          return [post, ...without]
        })
        setHasPublishedLive(true)
        setError(null)

        return { post, welcomeApplied: wasFirst }
      } catch (err) {
        console.error('[FotoHabit] publishPost failed', err)
        const message = friendlyPublishMessage(err)
        setError(message)
        throw new Error(message)
      }
    },
    [user, hasPublishedLive],
  )

  const getPostsByUserId = useCallback(
    (userId: string) => posts.filter((p) => p.userId === userId),
    [posts],
  )

  const deletePost = useCallback(
    async (postId: string) => {
      if (!user) throw new Error('Debes iniciar sesión')
      const post = posts.find((p) => p.id === postId)
      if (!post) throw new Error('Publicación no encontrada')
      if (post.userId !== user.id) {
        throw new Error('Solo puedes eliminar tus propias fotos')
      }
      const looksRemote = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        postId,
      )
      if (looksRemote) {
        await deleteOwnPost(postId)
      }
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    },
    [user, posts],
  )

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      if (!user) throw new Error('Debes iniciar sesión')
      const post = posts.find((p) => p.id === postId)
      const comment = post?.comments?.find((c) => c.id === commentId)
      if (!comment) throw new Error('Comentario no encontrado')
      if (comment.userId !== user.id) {
        throw new Error('Solo puedes eliminar tus propios comentarios')
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                comments: (p.comments ?? []).filter((c) => c.id !== commentId),
              },
        ),
      )
    },
    [user, posts],
  )

  const reportPost = useCallback(
    async (postId: string, reason?: string) => {
      await reportContent({
        targetType: 'post',
        targetId: postId,
        reason: reason ?? 'Publicación reportada desde el feed',
      })
    },
    [],
  )

  const reportComment = useCallback(
    async (commentId: string, reason?: string) => {
      await reportContent({
        targetType: 'comment',
        targetId: commentId,
        reason: reason ?? 'Comentario reportado desde el feed',
      })
    },
    [],
  )

  const value = useMemo(
    () => ({
      posts,
      loading,
      error,
      hasPublishedLive,
      publishPost,
      deletePost,
      deleteComment,
      reportPost,
      reportComment,
      refreshFeed,
      getPostsByUserId,
    }),
    [
      posts,
      loading,
      error,
      hasPublishedLive,
      publishPost,
      deletePost,
      deleteComment,
      reportPost,
      reportComment,
      refreshFeed,
      getPostsByUserId,
    ],
  )

  return (
    <SocialFeedContext.Provider value={value}>{children}</SocialFeedContext.Provider>
  )
}

export function useSocialFeed() {
  const ctx = useContext(SocialFeedContext)
  if (!ctx) {
    throw new Error('useSocialFeed must be used within SocialFeedProvider')
  }
  return ctx
}
