export type HabitAccent =
  | 'cyan'
  | 'yellow'
  | 'lime'
  | 'fuchsia'
  | 'purple'

export type CommunityComment = {
  id: string
  userId: string
  text: string
  time: string
  /** Comentario del bot de bienvenida */
  welcome?: boolean
}

export type CommunityPost = {
  id: string
  userId: string
  habit: string
  accent: HabitAccent
  caption: string
  time: string
  likes: number
  /** Público en el feed global unificado */
  visibility?: 'public' | 'private'
  level?: number
  streakDays?: number
  /** Foto local tras validar */
  previewUrl?: string | null
  /** Imagen mock / remota */
  imageUrl?: string | null
  neonFire?: boolean
  comments?: CommunityComment[]
  /** Autor embebido (Supabase join profiles) */
  author?: CommunityUser
}

export type CommunityUser = {
  id: string
  name: string
  initials: string
  bio: string
  streak: number
  primaryHabit: string
  postsCount: number
  followersCount: number
  followingCount: number
  likesCount: number
  accent: HabitAccent
  isSelf?: boolean
  isBot?: boolean
  followerIds: string[]
  followingIds: string[]
}

export const ACCENT_STYLES: Record<
  HabitAccent,
  { text: string; glow: string; border: string; soft: string; ring: string }
> = {
  cyan: {
    text: 'text-neon-cyan',
    glow: 'from-neon-cyan/25',
    border: 'border-neon-cyan/40',
    soft: 'bg-neon-cyan/10',
    ring: 'shadow-[0_0_28px_-8px_var(--color-neon-cyan)]',
  },
  yellow: {
    text: 'text-neon-yellow',
    glow: 'from-neon-yellow/25',
    border: 'border-neon-yellow/40',
    soft: 'bg-neon-yellow/10',
    ring: 'shadow-[0_0_28px_-8px_var(--color-neon-yellow)]',
  },
  lime: {
    text: 'text-neon-lime',
    glow: 'from-neon-lime/25',
    border: 'border-neon-lime/40',
    soft: 'bg-neon-lime/10',
    ring: 'shadow-[0_0_28px_-8px_var(--color-neon-lime)]',
  },
  fuchsia: {
    text: 'text-neon-fuchsia',
    glow: 'from-neon-fuchsia/25',
    border: 'border-neon-fuchsia/40',
    soft: 'bg-neon-fuchsia/10',
    ring: 'shadow-[0_0_28px_-8px_var(--color-neon-fuchsia)]',
  },
  purple: {
    text: 'text-neon-purple',
    glow: 'from-neon-purple/25',
    border: 'border-neon-purple/40',
    soft: 'bg-neon-purple/10',
    ring: 'shadow-[0_0_28px_-8px_var(--color-neon-purple)]',
  },
}

export const CURRENT_USER_ID = 'laura'
export const WELCOME_BOT_ID = 'fotohabito-bot'

/** Imágenes placeholder (Unsplash) por hábito — feed siempre visual. */
const IMG = {
  hiit: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop',
  run: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80&auto=format&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80&auto=format&fit=crop',
  bowl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop',
  breakfast: 'https://images.unsplash.com/photo-1495214783159-20039b37b3a8?w=800&q=80&auto=format&fit=crop',
  clean: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&auto=format&fit=crop',
  desk: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80&auto=format&fit=crop',
  book: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80&auto=format&fit=crop',
  meditate: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80&auto=format&fit=crop',
  sleep: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80&auto=format&fit=crop',
  walk: 'https://images.unsplash.com/photo-1552674601-e1e4c5f5a9a0?w=800&q=80&auto=format&fit=crop',
  kitchen: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80&auto=format&fit=crop',
} as const

/** Bio inspiracional por defecto del perfil propio (si el campo editable está vacío). */
export const DEFAULT_PROFILE_BIO =
  '21 días crean un hábito · Construyendo disciplina con prueba visual 🔥'

/** Lema de marca usado en cabeceras y bienvenida. */
export const HABIT_MOTTO = '21 Días crean el hábito'

export const PROFILE_BIO_MAX_LENGTH = 120

export const COMMUNITY_USERS: Record<string, CommunityUser> = {
  laura: {
    id: 'laura',
    name: 'Laura M.',
    initials: 'LM',
    bio: DEFAULT_PROFILE_BIO,
    streak: 12,
    primaryHabit: 'Actividad Física',
    postsCount: 13,
    followersCount: 128,
    followingCount: 86,
    likesCount: 450,
    accent: 'cyan',
    isSelf: true,
    followerIds: ['carlos', 'maria', 'diego', 'ana', 'sofia', 'javier', 'lucia', 'marco'],
    followingIds: ['carlos', 'maria', 'diego', 'ana', 'sofia'],
  },
  [WELCOME_BOT_ID]: {
    id: WELCOME_BOT_ID,
    name: 'Kore',
    initials: 'KO',
    bio: 'Tu compañero de constancia en Kore Habits. Celebramos cada foto validada con fuego 🔥',
    streak: 999,
    primaryHabit: 'Comunidad',
    postsCount: 0,
    followersCount: 12000,
    followingCount: 0,
    likesCount: 48000,
    accent: 'purple',
    isBot: true,
    followerIds: [],
    followingIds: [],
  },
  carlos: {
    id: 'carlos',
    name: 'Carlos R.',
    initials: 'CR',
    bio: 'HIIT, caminatas y cero excusas. Comparto cada prueba para no romper la racha.',
    streak: 18,
    primaryHabit: 'Actividad Física',
    postsCount: 22,
    followersCount: 214,
    followingCount: 95,
    likesCount: 890,
    accent: 'cyan',
    followerIds: ['laura', 'maria', 'diego'],
    followingIds: ['laura', 'ana', 'sofia'],
  },
  maria: {
    id: 'maria',
    name: 'María G.',
    initials: 'MG',
    bio: 'Orden en casa, orden en la cabeza. Pequeños rincones, grandes cambios.',
    streak: 9,
    primaryHabit: 'Orden y Limpieza',
    postsCount: 15,
    followersCount: 167,
    followingCount: 112,
    likesCount: 520,
    accent: 'yellow',
    followerIds: ['laura', 'carlos', 'ana'],
    followingIds: ['laura', 'diego', 'sofia'],
  },
  diego: {
    id: 'diego',
    name: 'Diego P.',
    initials: 'DP',
    bio: 'Comida real, color en el plato y energía limpia. Nutrir también es un hábito.',
    streak: 6,
    primaryHabit: 'Comida Saludable y Equilibrada',
    postsCount: 11,
    followersCount: 98,
    followingCount: 74,
    likesCount: 310,
    accent: 'lime',
    followerIds: ['laura', 'carlos', 'sofia'],
    followingIds: ['laura', 'maria', 'javier'],
  },
  ana: {
    id: 'ana',
    name: 'Ana L.',
    initials: 'AL',
    bio: 'Lectura, respiración y yoga suave. Entreno la mente como el cuerpo.',
    streak: 5,
    primaryHabit: 'Enfoque y Mente',
    postsCount: 9,
    followersCount: 142,
    followingCount: 88,
    likesCount: 275,
    accent: 'fuchsia',
    followerIds: ['laura', 'maria', 'javier'],
    followingIds: ['laura', 'carlos', 'diego'],
  },
  sofia: {
    id: 'sofia',
    name: 'Sofía V.',
    initials: 'SV',
    bio: 'Mañanas activas y noches tempranas. La constancia es mi superpoder.',
    streak: 14,
    primaryHabit: 'Actividad Física',
    postsCount: 18,
    followersCount: 201,
    followingCount: 130,
    likesCount: 640,
    accent: 'purple',
    followerIds: ['laura', 'carlos', 'diego'],
    followingIds: ['laura', 'maria', 'ana'],
  },
  javier: {
    id: 'javier',
    name: 'Javier N.',
    initials: 'JN',
    bio: 'Finanzas conscientes y hábitos limpios. Un euro menos gastado es un euro ganado.',
    streak: 7,
    primaryHabit: 'Ahorro y Finanzas',
    postsCount: 8,
    followersCount: 76,
    followingCount: 61,
    likesCount: 190,
    accent: 'yellow',
    followerIds: ['diego', 'ana'],
    followingIds: ['laura', 'diego', 'sofia'],
  },
  lucia: {
    id: 'lucia',
    name: 'Lucía T.',
    initials: 'LT',
    bio: 'Nivel 5 en sueño. Protejo mi descanso como un ritual sagrado.',
    streak: 32,
    primaryHabit: 'Sueño y Descanso',
    postsCount: 28,
    followersCount: 340,
    followingCount: 120,
    likesCount: 1100,
    accent: 'purple',
    followerIds: ['marco', 'sofia'],
    followingIds: ['laura', 'ana'],
  },
  marco: {
    id: 'marco',
    name: 'Marco E.',
    initials: 'ME',
    bio: 'Cocinero aficionado. Platos de colores = energía para la racha.',
    streak: 21,
    primaryHabit: 'Comida Saludable y Equilibrada',
    postsCount: 25,
    followersCount: 280,
    followingCount: 150,
    likesCount: 920,
    accent: 'lime',
    followerIds: ['diego', 'lucia'],
    followingIds: ['diego', 'laura'],
  },
  noa: {
    id: 'noa',
    name: 'Noa K.',
    initials: 'NK',
    bio: 'Empiezo el día con 10 páginas. La mente también necesita reps.',
    streak: 11,
    primaryHabit: 'Enfoque y Mente',
    postsCount: 14,
    followersCount: 155,
    followingCount: 90,
    likesCount: 410,
    accent: 'fuchsia',
    followerIds: ['ana'],
    followingIds: ['ana', 'sofia'],
  },
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    userId: 'carlos',
    habit: 'Actividad Física',
    accent: 'cyan',
    caption: '¡Entrenamiento completado! 20 min de HIIT.',
    time: 'hace 12 min',
    likes: 24,
    visibility: 'public',
    level: 3,
    streakDays: 18,
    imageUrl: IMG.hiit,
    comments: [
      { id: 'c1', userId: 'sofia', text: 'Esa energía 🔥', time: 'hace 8 min' },
    ],
  },
  {
    id: 'p2',
    userId: 'maria',
    habit: 'Orden y Limpieza',
    accent: 'yellow',
    caption: 'Cajón organizado. Pequeños hábitos, grandes cambios.',
    time: 'hace 41 min',
    likes: 17,
    visibility: 'public',
    level: 2,
    streakDays: 9,
    imageUrl: IMG.desk,
  },
  {
    id: 'p3',
    userId: 'diego',
    habit: 'Comida Saludable y Equilibrada',
    accent: 'lime',
    caption: 'Bowl de colores y fruta fresca. Comer bien también se disfruta.',
    time: 'hace 2 h',
    likes: 31,
    visibility: 'public',
    level: 1,
    streakDays: 6,
    imageUrl: IMG.bowl,
    comments: [
      { id: 'c2', userId: 'marco', text: 'Ese plato es arte.', time: 'hace 1 h' },
    ],
  },
  {
    id: 'p4',
    userId: 'ana',
    habit: 'Enfoque y Mente',
    accent: 'fuchsia',
    caption: '25 minutos de lectura sin pantallas. Mente clara.',
    time: 'hace 3 h',
    likes: 12,
    visibility: 'public',
    level: 1,
    streakDays: 5,
    imageUrl: IMG.book,
  },
  {
    id: 'p5',
    userId: 'lucia',
    habit: 'Sueño y Descanso',
    accent: 'purple',
    caption: 'Ritual nocturno: luces bajas y móvil fuera. Nivel 5 sellado.',
    time: 'hace 3 h',
    likes: 48,
    visibility: 'public',
    level: 5,
    streakDays: 32,
    imageUrl: IMG.sleep,
    neonFire: true,
  },
  {
    id: 'p6',
    userId: 'marco',
    habit: 'Comida Saludable y Equilibrada',
    accent: 'lime',
    caption: 'Batch cooking del domingo. La racha se cocina con antelación.',
    time: 'hace 4 h',
    likes: 39,
    visibility: 'public',
    level: 3,
    streakDays: 21,
    imageUrl: IMG.kitchen,
  },
  {
    id: 'p7',
    userId: 'sofia',
    habit: 'Actividad Física',
    accent: 'purple',
    caption: 'Yoga flow de 15 minutos. Cuerpo despierto.',
    time: 'hace 4 h',
    likes: 19,
    visibility: 'public',
    level: 2,
    streakDays: 14,
    imageUrl: IMG.yoga,
  },
  {
    id: 'p8',
    userId: 'noa',
    habit: 'Enfoque y Mente',
    accent: 'fuchsia',
    caption: 'Meditación 8 minutos antes del café. El día empieza distinto.',
    time: 'hace 5 h',
    likes: 22,
    visibility: 'public',
    level: 2,
    streakDays: 11,
    imageUrl: IMG.meditate,
  },
  {
    id: 'p9',
    userId: 'javier',
    habit: 'Ahorro y Finanzas',
    accent: 'yellow',
    caption: 'Café en casa. 3 € menos gastados = 1 fuego más a la racha.',
    time: 'hace 6 h',
    likes: 15,
    visibility: 'public',
    level: 1,
    streakDays: 7,
    imageUrl: IMG.breakfast,
  },
  {
    id: 'p10',
    userId: 'carlos',
    habit: 'Actividad Física',
    accent: 'cyan',
    caption: 'Carrera suave al parque. Sin gimnasio, sin excusas.',
    time: 'hace 8 h',
    likes: 33,
    visibility: 'public',
    level: 3,
    streakDays: 17,
    imageUrl: IMG.run,
  },
  {
    id: 'p11',
    userId: 'maria',
    habit: 'Orden y Limpieza',
    accent: 'yellow',
    caption: 'Estantería liberada. Menos cosas, más claridad.',
    time: 'hace 1 d',
    likes: 14,
    visibility: 'public',
    level: 2,
    streakDays: 8,
    imageUrl: IMG.clean,
  },
  {
    id: 'p12',
    userId: 'diego',
    habit: 'Comida Saludable y Equilibrada',
    accent: 'lime',
    caption: 'Desayuno con avena y frutos rojos. Energía limpia.',
    time: 'hace 1 d',
    likes: 27,
    visibility: 'public',
    level: 1,
    streakDays: 5,
    imageUrl: IMG.breakfast,
  },
  {
    id: 'p13',
    userId: 'lucia',
    habit: 'Actividad Física',
    accent: 'cyan',
    caption: 'Caminata al atardecer. El cuerpo agradece el aire.',
    time: 'hace 1 d',
    likes: 41,
    visibility: 'public',
    level: 4,
    streakDays: 28,
    imageUrl: IMG.walk,
  },
  {
    id: 'p14',
    userId: 'ana',
    habit: 'Enfoque y Mente',
    accent: 'fuchsia',
    caption: 'Capítulo nuevo del libro. 20 páginas sin prisa.',
    time: 'hace 2 d',
    likes: 18,
    visibility: 'public',
    level: 1,
    streakDays: 4,
    imageUrl: IMG.book,
  },
  {
    id: 'p15',
    userId: 'marco',
    habit: 'Comida Saludable y Equilibrada',
    accent: 'lime',
    caption: 'Ensalada arcoíris. Nivel 3 y subiendo.',
    time: 'hace 2 d',
    likes: 36,
    visibility: 'public',
    level: 3,
    streakDays: 20,
    imageUrl: IMG.bowl,
    neonFire: true,
  },
  {
    id: 'p-laura-1',
    userId: 'laura',
    habit: 'Actividad Física',
    accent: 'cyan',
    caption: 'HIIT de 20 min validado. La racha sigue viva.',
    time: 'hace 6 h',
    likes: 48,
    visibility: 'public',
    level: 2,
    streakDays: 12,
    imageUrl: IMG.hiit,
    neonFire: true,
  },
  {
    id: 'p-laura-2',
    userId: 'laura',
    habit: 'Comida Saludable y Equilibrada',
    accent: 'lime',
    caption: 'Bowl verde post-entreno. Prueba IA OK.',
    time: 'hace 1 d',
    likes: 37,
    visibility: 'public',
    level: 2,
    streakDays: 11,
    imageUrl: IMG.bowl,
  },
  {
    id: 'p-laura-3',
    userId: 'laura',
    habit: 'Enfoque y Mente',
    accent: 'fuchsia',
    caption: 'Sesión de lectura sin distracciones.',
    time: 'hace 2 d',
    likes: 29,
    visibility: 'public',
    level: 1,
    streakDays: 8,
    imageUrl: IMG.book,
  },
  {
    id: 'p-laura-4',
    userId: 'laura',
    habit: 'Actividad Física',
    accent: 'cyan',
    caption: 'Carrera suave al amanecer. Día sellado.',
    time: 'hace 3 d',
    likes: 52,
    visibility: 'public',
    level: 2,
    streakDays: 10,
    imageUrl: IMG.run,
    neonFire: true,
  },
  {
    id: 'p-laura-5',
    userId: 'laura',
    habit: 'Orden y Limpieza',
    accent: 'yellow',
    caption: 'Escritorio listo para enfocarme.',
    time: 'hace 4 d',
    likes: 21,
    visibility: 'public',
    level: 1,
    streakDays: 7,
    imageUrl: IMG.desk,
  },
  {
    id: 'p-laura-6',
    userId: 'laura',
    habit: 'Sueño y Descanso',
    accent: 'purple',
    caption: 'Ritual nocturno cumplido. Descanso de calidad.',
    time: 'hace 5 d',
    likes: 34,
    visibility: 'public',
    level: 1,
    streakDays: 6,
    imageUrl: IMG.sleep,
  },
]

export function getUser(id: string): CommunityUser | undefined {
  return COMMUNITY_USERS[id]
}

export function getCurrentUser(): CommunityUser {
  return COMMUNITY_USERS[CURRENT_USER_ID]
}

export function getPostsByUser(userId: string): CommunityPost[] {
  return getGlobalPublicFeed().filter((p) => p.userId === userId)
}

/** Feed unificado global: todas las publicaciones públicas de la plataforma. */
export function getGlobalPublicFeed(): CommunityPost[] {
  return COMMUNITY_POSTS.filter((p) => (p.visibility ?? 'public') === 'public')
}

/** @deprecated usa getGlobalPublicFeed */
export function getFeedPosts(): CommunityPost[] {
  return getGlobalPublicFeed()
}

export function habitAccentFromCategory(categoryId: string): HabitAccent {
  switch (categoryId) {
    case 'actividad-fisica':
      return 'cyan'
    case 'orden-limpieza':
      return 'yellow'
    case 'comida-saludable':
      return 'lime'
    case 'enfoque-mente':
      return 'fuchsia'
    default:
      return 'purple'
  }
}

export function getUsersByIds(ids: string[]): CommunityUser[] {
  return ids.map((id) => COMMUNITY_USERS[id]).filter(Boolean)
}

export const WELCOME_COMMENTS: Omit<CommunityComment, 'id'>[] = [
  {
    userId: WELCOME_BOT_ID,
    text: '¡Bienvenida a la comunidad! 🔥🔥 Tu primera prueba ya ilumina el feed. Sigue así.',
    time: 'ahora',
    welcome: true,
  },
  {
    userId: 'sofia',
    text: 'Qué ilusión ver tu primera foto aquí. ¡La racha empieza fuerte!',
    time: 'ahora',
    welcome: true,
  },
]
