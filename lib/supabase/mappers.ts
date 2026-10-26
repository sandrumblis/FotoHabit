import type { HabitAccent, CommunityPost, CommunityUser } from '@/lib/community-data'
import type { HabitRow, PostWithRelations, ProfileRow } from './database.types'

const ACCENTS: HabitAccent[] = ['cyan', 'yellow', 'lime', 'fuchsia', 'purple']

const CATEGORY_ACCENT: Record<string, HabitAccent> = {
  'actividad-fisica': 'cyan',
  'comida-saludable': 'lime',
  'enfoque-mente': 'fuchsia',
  'orden-limpieza': 'yellow',
  'sueno-descanso': 'purple',
  'ahorro-finanzas': 'lime',
  'sin-humos': 'yellow',
  personalizado: 'cyan',
}

export function asAccent(value: string | null | undefined, fallback: HabitAccent = 'cyan'): HabitAccent {
  if (value && ACCENTS.includes(value as HabitAccent)) return value as HabitAccent
  return fallback
}

export function accentFromCategory(category: string | null | undefined): HabitAccent {
  if (!category) return 'cyan'
  if (ACCENTS.includes(category as HabitAccent)) return category as HabitAccent
  return CATEGORY_ACCENT[category] ?? 'cyan'
}

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'FH'
  )
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function profileToCommunityUser(
  profile: ProfileRow,
  extras?: Partial<CommunityUser>,
): CommunityUser {
  const name = profile.username?.trim() || 'Usuario FotoHabit'
  return {
    id: profile.id,
    name,
    initials: initialsFromName(name),
    bio: extras?.bio ?? '',
    streak: extras?.streak ?? 0,
    primaryHabit: extras?.primaryHabit ?? 'Hábitos',
    postsCount: extras?.postsCount ?? 0,
    followersCount: extras?.followersCount ?? 0,
    followingCount: extras?.followingCount ?? 0,
    likesCount: extras?.likesCount ?? 0,
    accent: extras?.accent ?? 'cyan',
    followerIds: extras?.followerIds ?? [],
    followingIds: extras?.followingIds ?? [],
    isSelf: extras?.isSelf,
  }
}

export function formatRelativeTime(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (diffSec < 45) return 'ahora'
  if (diffSec < 3600) return `hace ${Math.round(diffSec / 60)} min`
  if (diffSec < 86400) return `hace ${Math.round(diffSec / 3600)} h`
  return `hace ${Math.round(diffSec / 86400)} d`
}

export function mapPostRow(row: PostWithRelations): CommunityPost | null {
  const profile = unwrapOne(row.profiles)
  const habit = unwrapOne(row.habits) as HabitRow | null
  if (!profile) return null

  const accent = accentFromCategory(habit?.category)
  const author = profileToCommunityUser(profile, {
    streak: habit?.streak_days ?? 0,
    primaryHabit: habit?.title ?? 'Hábito',
    accent,
  })

  return {
    id: row.id,
    userId: row.user_id,
    habit: habit?.title ?? 'Hábito',
    accent,
    caption: row.caption ?? '',
    time: formatRelativeTime(row.created_at),
    likes: 0,
    visibility: 'public',
    level: profile.level ?? undefined,
    streakDays: habit?.streak_days ?? undefined,
    imageUrl: row.image_url,
    previewUrl: null,
    neonFire: false,
    comments: [],
    author,
  }
}
