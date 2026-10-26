import {
  HABIT_CHALLENGE_DAYS,
  HABIT_CHALLENGES,
  PHASE_META,
  getCategoryMeta,
  type DailyChallenge,
  type HabitCategoryId,
  type HabitPhase,
} from '@/lib/habit-challenges'

export const LEVEL_BLOCK_DAYS = 7
export const HABIT_CREATED_DAY = 21
export const MAINTENANCE_START_DAY = 22

/** Nivel = ⌊(día − 1) / 7⌋ + 1 */
export function getLevelForDay(day: number): number {
  const safe = Math.max(1, Math.floor(day))
  return Math.floor((safe - 1) / LEVEL_BLOCK_DAYS) + 1
}

/** Nivel del día en curso (completed + 1). */
export function getCurrentLevel(completed: number): number {
  return getLevelForDay(Math.max(completed + 1, 1))
}

/** Nivel asociado a los días ya validados (0 → nivel 1). */
export function getLevelFromCompleted(completed: number): number {
  if (completed <= 0) return 1
  return getLevelForDay(completed)
}

export function getDayInLevel(day: number): number {
  return ((Math.max(1, day) - 1) % LEVEL_BLOCK_DAYS) + 1
}

export function isLevelMilestoneDay(completedDay: number): boolean {
  return completedDay > 0 && completedDay % LEVEL_BLOCK_DAYS === 0
}

export function isHabitCreatedMilestone(completedDay: number): boolean {
  return completedDay === HABIT_CREATED_DAY
}

export function isMaintenanceDay(day: number): boolean {
  return day >= MAINTENANCE_START_DAY
}

export function getLevelMeta(level: number): {
  name: string
  short: string
  focus: string
} {
  switch (level) {
    case 1:
      return {
        name: 'Iniciación',
        short: 'Iniciación',
        focus: 'Toma de contacto sin fricción',
      }
    case 2:
      return {
        name: 'Consistencia',
        short: 'Consistencia',
        focus: 'Ritmo e intensidad gradual',
      }
    case 3:
      return {
        name: 'Consolidación',
        short: 'Consolidación',
        focus: 'Maestría para sellar el hábito',
      }
    case 4:
      return {
        name: 'Hábito Creado',
        short: 'Mantenimiento',
        focus: 'Pon en práctica todo lo aprendido',
      }
    default:
      return {
        name: `Nivel ${level}`,
        short: 'Mantenimiento',
        focus: 'Constancia libre · sube de nivel cada 7 días',
      }
  }
}

/** Días completados dentro del bloque de 7 del nivel en curso. */
export function getLevelBlockDays(completed: number): {
  done: number
  total: number
  /** 0–1 */
  ratio: number
  /** 0–100 */
  percent: number
} {
  const level = getCurrentLevel(completed)
  const levelStart = (level - 1) * LEVEL_BLOCK_DAYS
  const done = Math.max(0, Math.min(completed - levelStart, LEVEL_BLOCK_DAYS))
  const total = LEVEL_BLOCK_DAYS
  const ratio = done / total
  return { done, total, ratio, percent: Math.round(ratio * 100) }
}

/** Progreso dentro del bloque de 7 días del nivel en curso (0–100). */
export function getLevelBlockProgress(completed: number): number {
  return getLevelBlockDays(completed).percent
}

export const MAINTENANCE_TITLE = 'Consolidación del Hábito'
export const MAINTENANCE_DESCRIPTION =
  'Sube tu foto diaria relacionada con este objetivo para mantener tu racha.'
export const MAINTENANCE_TIP =
  'Cualquier prueba relacionada con tu objetivo cuenta. La constancia es el hábito.'

export function createMaintenanceChallenge(day: number): DailyChallenge {
  return {
    day,
    phase: 'mantenimiento',
    title: MAINTENANCE_TITLE,
    description: MAINTENANCE_DESCRIPTION,
    tip: MAINTENANCE_TIP,
  }
}

export type RoadmapWeek = {
  key: string
  level: number
  phase: HabitPhase
  label: string
  week: string
  focus: string
  challenges: DailyChallenge[]
}

function maintenanceWeek(level: number): RoadmapWeek {
  const start = (level - 1) * LEVEL_BLOCK_DAYS + 1
  const end = level * LEVEL_BLOCK_DAYS
  const meta = getLevelMeta(level)
  return {
    key: `level-${level}`,
    level,
    phase: 'mantenimiento',
    label: meta.name,
    week: `Nivel ${level} · Días ${start}–${end}`,
    focus: meta.focus,
    challenges: Array.from({ length: LEVEL_BLOCK_DAYS }, (_, i) =>
      createMaintenanceChallenge(start + i),
    ),
  }
}

/** Semanas del roadmap: 1–3 fijas + bloques infinitos de mantenimiento según progreso. */
export function getRoadmapWeeks(
  categoryId: HabitCategoryId,
  completed: number,
): RoadmapWeek[] {
  const list = HABIT_CHALLENGES[categoryId]
  const baseWeeks: RoadmapWeek[] = (
    ['adaptacion', 'consistencia', 'consolidacion'] as Array<
      Exclude<HabitPhase, 'mantenimiento'>
    >
  ).map((phase, index) => {
    const level = index + 1
    return {
      key: phase,
      level,
      phase,
      label: PHASE_META[phase].label,
      week: PHASE_META[phase].week,
      focus: PHASE_META[phase].focus,
      challenges: list.filter((c) => c.phase === phase),
    }
  })

  const currentDay = Math.max(completed + 1, 1)
  const maxLevel = Math.max(getLevelForDay(currentDay), 4)

  // Solo añadir mantenimiento cuando el usuario entra o supera el día 22
  if (currentDay < MAINTENANCE_START_DAY && completed < HABIT_CREATED_DAY) {
    return baseWeeks
  }

  const maintenanceWeeks: RoadmapWeek[] = []
  for (let level = 4; level <= maxLevel; level++) {
    maintenanceWeeks.push(maintenanceWeek(level))
  }

  // Adelantar un bloque más si está en el último día del nivel actual
  if (isLevelMilestoneDay(completed) && completed >= HABIT_CREATED_DAY) {
    const nextLevel = getLevelForDay(completed) + 1
    if (nextLevel > maxLevel) {
      maintenanceWeeks.push(maintenanceWeek(nextLevel))
    }
  }

  return [...baseWeeks, ...maintenanceWeeks]
}

export function formatLevelHeadline(completed: number): string {
  const day = Math.max(completed + 1, 1)
  const level = getLevelForDay(day)
  return `NIVEL ${level} · DÍA ${day} DE HÁBITO`
}

export function formatCommunityLevelLine(
  habitTitle: string,
  streakDays: number,
): string {
  const level = getLevelFromCompleted(streakDays)
  return `Nivel ${level} en ${habitTitle}`
}

export function getObjectiveLabel(categoryId: HabitCategoryId): string {
  return getCategoryMeta(categoryId).title
}
