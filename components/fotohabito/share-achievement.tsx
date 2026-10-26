'use client'

import { useCallback, useRef, useState } from 'react'
import { Check, Copy, Download, Flame, Link2, Loader2, Share2 } from 'lucide-react'
import { HABIT_MOTTO } from '@/lib/community-data'
import { cn } from '@/lib/utils'

export type ShareAchievementData = {
  photoUrl?: string | null
  habit: string
  level: number
  streakDays: number
  title?: string
  subtitle?: string
}

type ShareAchievementProps = {
  data: ShareAchievementData
  className?: string
  /** Compact mode for embedding in success sheets */
  compact?: boolean
}

const CARD_W = 1080
const CARD_H = 1920

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function buildStoryBlob(data: ShareAchievementData): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Background
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  bg.addColorStop(0, '#09090b')
  bg.addColorStop(0.45, '#0f172a')
  bg.addColorStop(1, '#09090b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Neon frame
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)'
  ctx.lineWidth = 6
  ctx.strokeRect(48, 48, CARD_W - 96, CARD_H - 96)

  // Logo / brand
  ctx.fillStyle = '#00f0ff'
  ctx.font = '700 42px system-ui, sans-serif'
  ctx.fillText('Kore', 96, 140)
  ctx.fillStyle = 'rgba(188, 19, 254, 0.95)'
  ctx.font = '600 28px ui-monospace, monospace'
  ctx.fillText(HABIT_MOTTO.toUpperCase(), 96, 190)

  // Photo area
  const photoTop = 260
  const photoH = 980
  const photoX = 96
  const photoW = CARD_W - 192
  ctx.save()
  roundRect(ctx, photoX, photoTop, photoW, photoH, 48)
  ctx.clip()

  if (data.photoUrl) {
    const img = await loadImage(data.photoUrl)
    if (img) {
      const scale = Math.max(photoW / img.width, photoH / img.height)
      const iw = img.width * scale
      const ih = img.height * scale
      ctx.drawImage(img, photoX + (photoW - iw) / 2, photoTop + (photoH - ih) / 2, iw, ih)
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(photoX, photoTop, photoW, photoH)
    }
  } else {
    const g = ctx.createLinearGradient(photoX, photoTop, photoX + photoW, photoTop + photoH)
    g.addColorStop(0, 'rgba(0,240,255,0.25)')
    g.addColorStop(1, 'rgba(188,19,254,0.25)')
    ctx.fillStyle = g
    ctx.fillRect(photoX, photoTop, photoW, photoH)
    ctx.fillStyle = '#fff'
    ctx.font = '600 48px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.title ?? 'Logro Kore', photoX + photoW / 2, photoTop + photoH / 2)
    ctx.textAlign = 'left'
  }
  ctx.restore()

  // Habit badge
  ctx.fillStyle = 'rgba(0, 240, 255, 0.18)'
  roundRect(ctx, 96, 1300, 520, 72, 36)
  ctx.fill()
  ctx.fillStyle = '#00f0ff'
  ctx.font = '700 32px ui-monospace, monospace'
  ctx.fillText(data.habit.slice(0, 28).toUpperCase(), 128, 1346)

  // Streak / level
  ctx.fillStyle = '#ffe600'
  ctx.font = '700 64px system-ui, sans-serif'
  ctx.fillText(`Nivel ${data.level}`, 96, 1480)
  ctx.font = '600 44px system-ui, sans-serif'
  ctx.fillText(`${data.streakDays} días 🔥`, 96, 1550)

  if (data.subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '400 30px system-ui, sans-serif'
    wrapText(ctx, data.subtitle, 96, 1630, CARD_W - 192, 40)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '500 28px ui-monospace, monospace'
  ctx.fillText('Kore Habits', 96, CARD_H - 100)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95)
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/)
  let line = ''
  let yy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy)
      line = word
      yy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
}

function shareUrl() {
  if (typeof window === 'undefined') return 'https://kore.habits'
  return window.location.origin
}

export function ShareAchievement({ data, className, compact }: ShareAchievementProps) {
  const [busy, setBusy] = useState<'share' | 'download' | 'link' | null>(null)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const shareText = `${data.title ?? 'Mi logro en Kore'} · ${data.habit} · Nivel ${data.level} · ${data.streakDays} días 🔥\n${HABIT_MOTTO}\n${shareUrl()}`

  const runShare = useCallback(async () => {
    setBusy('share')
    setNotice(null)
    try {
      const blob = await buildStoryBlob(data)
      if (!blob) throw new Error('No se pudo generar la tarjeta')

      const file = new File([blob], `kore-logro-${Date.now()}.png`, { type: 'image/png' })

      if (typeof navigator !== 'undefined' && navigator.share) {
        const canFiles =
          !navigator.canShare || navigator.canShare({ files: [file] })
        if (canFiles) {
          await navigator.share({
            title: 'Kore Habits · Logro',
            text: shareText,
            files: [file],
          })
        } else {
          await navigator.share({
            title: 'Kore Habits · Logro',
            text: shareText,
            url: shareUrl(),
          })
        }
        setNotice('Listo para WhatsApp, Instagram, Telegram…')
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        setNotice('Compartir nativo no disponible · foto descargada')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        /* user cancelled */
      } else {
        setNotice('No se pudo abrir el menú de compartir')
      }
    } finally {
      setBusy(null)
      window.setTimeout(() => setNotice(null), 3200)
    }
  }, [data, shareText])

  const runDownload = useCallback(async () => {
    setBusy('download')
    try {
      const blob = await buildStoryBlob(data)
      if (!blob) throw new Error('fail')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kore-logro-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
      setNotice('Foto guardada')
    } catch {
      setNotice('No se pudo descargar')
    } finally {
      setBusy(null)
      window.setTimeout(() => setNotice(null), 2800)
    }
  }, [data])

  const runCopyLink = useCallback(async () => {
    setBusy('link')
    try {
      await navigator.clipboard.writeText(`${shareText}`)
      setCopied(true)
      setNotice('Enlace / texto copiado')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setNotice('No se pudo copiar')
    } finally {
      setBusy(null)
      window.setTimeout(() => setNotice(null), 2800)
    }
  }, [shareText])

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {/* Story preview */}
      <div
        ref={previewRef}
        className={cn(
          'relative mx-auto w-full overflow-hidden rounded-3xl border border-neon-cyan/35 bg-zinc-950 shadow-[0_0_40px_-12px_var(--color-neon-cyan)]',
          compact ? 'max-w-[220px] aspect-[9/16]' : 'max-w-[260px] aspect-[9/16]',
        )}
      >
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-90"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/30 via-background to-neon-fuchsia/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/50" />
        <div className="absolute inset-0 flex flex-col justify-between p-3.5">
          <div>
            <p className="text-sm font-bold text-neon-cyan [text-shadow:0_0_12px_rgba(0,240,255,0.5)]">
              Kore
            </p>
            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-neon-fuchsia">
              {HABIT_MOTTO}
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="inline-flex rounded-full border border-neon-cyan/40 bg-black/50 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-neon-cyan backdrop-blur-md">
              {data.habit}
            </span>
            <p className="text-base font-semibold text-white">
              {data.title ?? `Nivel ${data.level}`}
            </p>
            <p className="inline-flex items-center gap-1 font-mono text-[11px] text-neon-yellow">
              <Flame className="size-3 fill-neon-yellow" aria-hidden="true" />
              {data.streakDays} días · Nv.{data.level}
            </p>
            <p className="font-mono text-[8px] text-white/50">Kore Habits</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void runShare()}
        disabled={busy !== null}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neon-cyan text-sm font-semibold text-background shadow-[0_0_28px_-6px_var(--color-neon-cyan)] transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {busy === 'share' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Share2 className="size-4" aria-hidden="true" />
        )}
        Compartir logro
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void runDownload()}
          disabled={busy !== null}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 text-xs font-semibold text-foreground disabled:opacity-60"
        >
          {busy === 'download' ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-3.5" aria-hidden="true" />
          )}
          Descargar foto
        </button>
        <button
          type="button"
          onClick={() => void runCopyLink()}
          disabled={busy !== null}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 text-xs font-semibold text-foreground disabled:opacity-60"
        >
          {copied ? (
            <Check className="size-3.5 text-neon-lime" aria-hidden="true" />
          ) : busy === 'link' ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          Copiar enlace
        </button>
      </div>

      {notice ? (
        <p
          role="status"
          className="inline-flex items-center justify-center gap-1.5 text-center font-mono text-[10px] text-neon-lime"
        >
          <Link2 className="size-3" aria-hidden="true" />
          {notice}
        </p>
      ) : null}
    </div>
  )
}
