'use client'

import { useId, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type NeonProgressRingProps = {
  /** 0–1 */
  progress: number
  /** Color CSS del arco (ej. var(--color-neon-cyan) o #00f0ff) */
  color: string
  size?: number
  strokeWidth?: number
  className?: string
  children?: ReactNode
  /** track oscuro/sutil */
  trackColor?: string
}

export function NeonProgressRing({
  progress,
  color,
  size = 76,
  strokeWidth = 3.5,
  className,
  children,
  trackColor = 'rgba(255,255,255,0.08)',
}: NeonProgressRingProps) {
  const filterId = useId().replace(/:/g, '')
  const clamped = Math.min(1, Math.max(0, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped)
  const center = size / 2
  /** Margen para que el blur/glow no se recorte en el SVG */
  const filterPad = Math.ceil(size * 0.45)

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-full',
        className,
      )}
      style={
        {
          width: size,
          height: size,
          '--ring-neon': color,
        } as CSSProperties
      }
    >
      {/* Halo circular suave (nunca cuadrado) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${color} 45%, transparent) 0%, transparent 70%)`,
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        overflow="visible"
        className="pointer-events-none absolute inset-0 -rotate-90 overflow-visible"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={`neon-arc-${filterId}`}
            x={-filterPad}
            y={-filterPad}
            width={size + filterPad * 2}
            height={size + filterPad * 2}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--ring-neon)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter={`url(#neon-arc-${filterId})`}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      <div className="relative z-[1] flex size-[calc(100%-10px)] items-center justify-center overflow-hidden rounded-full bg-transparent">
        {children}
      </div>
    </div>
  )
}
