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
import type { CommunityPost } from '@/lib/community-data'

type PublishInput = {
  habit: string
  accent: CommunityPost['accent']
  caption: string
  level: number
  streakDays: number
  previewUrl?: string | null
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
  refreshFeed: () => Promise<void>
  getPostsByUserId: (userId: string) => CommunityPost[]
}

const SocialFeedContext = createContext<SocialFeedContextValue | null>(null)

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

    const supabase = createClient()
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          void refreshFeed()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [isAuthenticated, refreshFeed])

  const publishPost = useCallback(
    async (input: PublishInput): Promise<PublishResult> => {
      if (!user) throw new Error('Debes iniciar sesión para publicar')
      if (!input.previewUrl) throw new Error('Falta la foto validada')

      const wasFirst = !hasPublishedLive
      const post = await publishValidatedPhoto({
        userId: user.id,
        displayName: user.name,
        habitTitle: input.habit,
        categoryKey: input.categoryId,
        accent: input.accent,
        caption: input.caption,
        streakDays: input.streakDays,
        level: input.level,
        image: input.previewUrl,
      })

      setPosts((prev) => {
        const without = prev.filter((p) => p.id !== post.id)
        return [post, ...without]
      })
      setHasPublishedLive(true)

      return { post, welcomeApplied: wasFirst }
    },
    [user, hasPublishedLive],
  )

  const getPostsByUserId = useCallback(
    (userId: string) => posts.filter((p) => p.userId === userId),
    [posts],
  )

  const value = useMemo(
    () => ({
      posts,
      loading,
      error,
      hasPublishedLive,
      publishPost,
      refreshFeed,
      getPostsByUserId,
    }),
    [
      posts,
      loading,
      error,
      hasPublishedLive,
      publishPost,
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
