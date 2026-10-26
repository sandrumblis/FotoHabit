'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

type CommunityFireButtonProps = {
  count: number
  active?: boolean
  onToggle?: () => void
  size?: 'sm' | 'md'
  className?: string
  /** Solo lectura (p. ej. miniatura en perfil) */
  readOnly?: boolean
}

export function CommunityFireButton({
  count,
  active = false,
  onToggle,
  size = 'md',
  className,
  readOnly = false,
}: CommunityFireButtonProps) {
  const iconSize = size === 'sm' ? 'size-2.5' : 'size-3.5'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  const content = (
    <>
      <Flame
        className={cn(
          iconSize,
          'transition-all duration-300',
          active
            ? 'fill-neon-yellow text-neon-yellow drop-shadow-[0_0_8px_var(--color-neon-yellow)]'
            : 'text-muted-foreground',
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'font-mono tabular-nums transition-colors duration-300',
          active ? 'text-neon-yellow' : 'text-muted-foreground',
        )}
      >
        {count}
      </span>
    </>
  )

  if (readOnly || !onToggle) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5', textSize, className)}
        title={`${count} fuegos`}
      >
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `Quitar fuego (${count})` : `Dar fuego (${count})`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-yellow/60',
        textSize,
        active
          ? 'bg-neon-yellow/10 shadow-[0_0_20px_-4px_var(--color-neon-yellow)]'
          : 'hover:bg-white/5 hover:text-neon-yellow',
        className,
      )}
    >
      {content}
    </button>
  )
}
