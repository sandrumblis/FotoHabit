/** Mensaje único de bloqueo diario (UI + API). */
export const DAILY_VALIDATION_BLOCKED_MESSAGE =
  'Ya has completado tu hábito de hoy. ¡Vuelve mañana para mantener tu racha!'

/** Fecha local YYYY-MM-DD. */
export function localTodayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}
