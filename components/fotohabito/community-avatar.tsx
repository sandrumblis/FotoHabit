import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { ACCENT_STYLES, type HabitAccent } from '@/lib/community-data'
import { NeonProgressRing } from './neon-progress-ring'

type CommunityAvatarProps = {
  initials: string
  accent?: HabitAccent
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** 0–1 progreso del anillo neón (opcional) */
  progress?: number
  /** Color del anillo; por defecto el del accent */
  ringColor?: string
}

const SIZE_PX = {
  sm: 36,
  md: 44,
  lg: 72,
  xl: 96,
} as const

const STROKE = {
  sm: 2.5,
  md: 2.75,
  lg: 3.25,
  xl: 3.75,
} as const

const TEXT = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-base sm:text-lg',
  xl: 'text-lg sm:text-xl',
} as const

const ACCENT_CSS: Record<HabitAccent, string> = {
  cyan: 'var(--color-neon-cyan)',
  yellow: 'var(--color-neon-yellow)',
  lime: 'var(--color-neon-lime)',
  fuchsia: 'var(--color-neon-fuchsia)',
  purple: 'var(--color-neon-purple)',
}

export function CommunityAvatar({
  initials,
  accent = 'cyan',
  size = 'md',
  className,
  progress,
  ringColor,
}: CommunityAvatarProps) {
  const styles = ACCENT_STYLES[accent]
  const color = ringColor ?? ACCENT_CSS[accent]
  const px = SIZE_PX[size]
  const showRing = typeof progress === 'number'

  const face = (
    <div
      className={cn(
        'flex size-full items-center justify-center overflow-hidden rounded-full bg-card font-semibold tracking-tight text-foreground',
        TEXT[size],
      )}
    >
      {initials}
    </div>
  )

  if (showRing) {
    return (
      <div
        className={cn('relative inline-flex shrink-0 overflow-visible rounded-full', className)}
      >
        <NeonProgressRing
          progress={progress}
          color={color}
          size={px}
          strokeWidth={STROKE[size]}
        >
          {face}
        </NeonProgressRing>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 overflow-visible rounded-full',
        className,
      )}
      style={{ width: px, height: px } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${color} 40%, transparent) 0%, transparent 72%)`,
        }}
      />
      <div
        className={cn(
          'relative size-full overflow-hidden rounded-full bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-yellow p-[2px]',
          styles.ring,
        )}
      >
        {face}
      </div>
    </div>
  )
}
