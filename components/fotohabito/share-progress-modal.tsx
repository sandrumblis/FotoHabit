'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, Share2, X, Zap } from 'lucide-react'
import { HABIT_MOTTO } from '@/lib/community-data'
import { cn } from '@/lib/utils'

export type ShareProgressData = {
  displayName: string
  initials: string
  longestStreak: number
  successRate: number
  totalValidated: number
  totalFueguitos: number
  weeklyBars: Array<{ label: string; value: number }>
  heatDays: Array<{ day: number; intensity: number }>
}

type ShareProgressModalProps = {
  open: boolean
  data: ShareProgressData
  onClose: () => void
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

function shareUrl() {
  if (typeof window === 'undefined') return 'https://fotohabit.app'
  return window.location.origin
}

async function buildProgressBlob(data: ShareProgressData): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const maybeCtx = canvas.getContext('2d')
  if (!maybeCtx) return null
  const ctx: CanvasRenderingContext2D = maybeCtx

  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  bg.addColorStop(0, '#050508')
  bg.addColorStop(0.4, '#0b1220')
  bg.addColorStop(1, '#09090b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Neon outer frame
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)'
  ctx.lineWidth = 5
  ctx.strokeRect(40, 40, CARD_W - 80, CARD_H - 80)
  ctx.strokeStyle = 'rgba(255, 230, 0, 0.28)'
  ctx.lineWidth = 2
  ctx.strokeRect(56, 56, CARD_W - 112, CARD_H - 112)

  // Brand mark
  const logo = await loadImage('/images/fotohabito-isotype.jpg?v=fotohabit-2')
  if (logo) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(140, 150, 52, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(logo, 88, 98, 104, 104)
    ctx.restore()
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(140, 150, 54, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = '#00f0ff'
  ctx.font = '700 56px system-ui, sans-serif'
  ctx.fillText('FotoHabit', 220, 145)
  ctx.fillStyle = 'rgba(188, 19, 254, 0.95)'
  ctx.font = '600 26px ui-monospace, monospace'
  ctx.fillText(HABIT_MOTTO.toUpperCase(), 220, 190)

  // Avatar + name
  const avatarY = 280
  ctx.beginPath()
  ctx.arc(CARD_W / 2, avatarY + 70, 78, 0, Math.PI * 2)
  const avGrad = ctx.createLinearGradient(
    CARD_W / 2 - 78,
    avatarY,
    CARD_W / 2 + 78,
    avatarY + 140,
  )
  avGrad.addColorStop(0, '#00f0ff')
  avGrad.addColorStop(0.5, '#7b61ff')
  avGrad.addColorStop(1, '#ffe600')
  ctx.fillStyle = avGrad
  ctx.fill()
  ctx.fillStyle = '#0b1220'
  ctx.beginPath()
  ctx.arc(CARD_W / 2, avatarY + 70, 70, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 42px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(data.initials || 'FH', CARD_W / 2, avatarY + 86)
  ctx.fillStyle = '#fff'
  ctx.font = '600 44px system-ui, sans-serif'
  ctx.fillText(data.displayName, CARD_W / 2, avatarY + 200)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '500 28px ui-monospace, monospace'
  ctx.fillText('MI PROGRESO EN FOTOHABIT', CARD_W / 2, avatarY + 250)
  ctx.textAlign = 'left'

  // Metric cards
  const cardTop = 620
  const cardW = 420
  const cardH = 200
  const gap = 40
  const leftX = (CARD_W - cardW * 2 - gap) / 2

  function drawMetric(
    x: number,
    y: number,
    label: string,
    value: string,
    color: string,
  ) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, x, y, cardW, cardH, 36)
    ctx.fill()
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.55
    ctx.lineWidth = 2
    roundRect(ctx, x, y, cardW, cardH, 36)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = color
    ctx.font = '600 24px ui-monospace, monospace'
    ctx.fillText(label, x + 36, y + 58)
    ctx.fillStyle = '#fff'
    ctx.font = '700 72px system-ui, sans-serif'
    ctx.fillText(value, x + 36, y + 145)
  }

  drawMetric(leftX, cardTop, 'RACHA MÁS LARGA', `${data.longestStreak}d`, '#ffe600')
  drawMetric(
    leftX + cardW + gap,
    cardTop,
    'ÉXITO 21 DÍAS',
    `${data.successRate}%`,
    '#00f0ff',
  )

  // Mini bar chart
  const chartTop = 900
  const chartX = 96
  const chartW = CARD_W - 192
  const chartH = 280
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  roundRect(ctx, chartX, chartTop, chartW, chartH + 80, 40)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)'
  ctx.lineWidth = 2
  roundRect(ctx, chartX, chartTop, chartW, chartH + 80, 40)
  ctx.stroke()

  ctx.fillStyle = '#00f0ff'
  ctx.font = '600 24px ui-monospace, monospace'
  ctx.fillText('CONSTANCIA · 7 DÍAS', chartX + 40, chartTop + 48)

  const maxBar = Math.max(1, ...data.weeklyBars.map((b) => b.value))
  const barAreaTop = chartTop + 70
  const barAreaH = chartH - 40
  const barGap = 18
  const barW = (chartW - 80 - barGap * (data.weeklyBars.length - 1)) / data.weeklyBars.length

  data.weeklyBars.forEach((bar, i) => {
    const h = Math.max(16, (bar.value / maxBar) * (barAreaH - 40))
    const x = chartX + 40 + i * (barW + barGap)
    const y = barAreaTop + barAreaH - h
    const g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, '#39ff14')
    g.addColorStop(1, '#00f0ff')
    ctx.fillStyle = g
    roundRect(ctx, x, y, barW, h, 14)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '600 20px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(bar.label.slice(0, 3), x + barW / 2, chartTop + chartH + 50)
  })
  ctx.textAlign = 'left'

  // Mini heatmap
  const heatTop = 1320
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  roundRect(ctx, chartX, heatTop, chartW, 320, 40)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
  ctx.lineWidth = 2
  roundRect(ctx, chartX, heatTop, chartW, 320, 40)
  ctx.stroke()

  ctx.fillStyle = '#00f0ff'
  ctx.font = '600 24px ui-monospace, monospace'
  ctx.fillText('MAPA DE CALOR · FOTOS IA', chartX + 40, heatTop + 48)

  const cells = data.heatDays.slice(0, 28)
  const cols = 7
  const cellGap = 10
  const cellSize = Math.floor((chartW - 80 - cellGap * (cols - 1)) / cols)
  const colors = [
    'rgba(255,255,255,0.06)',
    'rgba(0,240,255,0.25)',
    'rgba(0,240,255,0.5)',
    'rgba(0,240,255,0.85)',
  ]

  cells.forEach((cell, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = chartX + 40 + col * (cellSize + cellGap)
    const y = heatTop + 80 + row * (cellSize + cellGap)
    ctx.fillStyle = colors[cell.intensity] ?? colors[0]
    roundRect(ctx, x, y, cellSize, cellSize, 10)
    ctx.fill()
  })

  // Footer stats + brand
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '500 28px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    `${data.totalValidated} pruebas IA · ${data.totalFueguitos} fueguitos 🔥`,
    CARD_W / 2,
    1740,
  )
  ctx.fillStyle = '#00f0ff'
  ctx.font = '700 36px system-ui, sans-serif'
  ctx.fillText('FotoHabit', CARD_W / 2, 1810)
  ctx.fillStyle = 'rgba(255,230,0,0.85)'
  ctx.font = '600 24px ui-monospace, monospace'
  ctx.fillText(HABIT_MOTTO, CARD_W / 2, 1860)
  ctx.textAlign = 'left'

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95)
  })
}

export function ShareProgressModal({ open, data, onClose }: ShareProgressModalProps) {
  const [busy, setBusy] = useState<'share' | 'download' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const shareText = `Mi progreso en FotoHabit ⚡\nRacha ${data.longestStreak}d · Éxito 21 días ${data.successRate}%\n${HABIT_MOTTO}\n${shareUrl()}`

  const runShare = useCallback(async () => {
    setBusy('share')
    setNotice(null)
    try {
      const blob = await buildProgressBlob(data)
      if (!blob) throw new Error('fail')
      const file = new File([blob], `fotohabit-progreso-${Date.now()}.png`, {
        type: 'image/png',
      })

      if (typeof navigator !== 'undefined' && navigator.share) {
        const canFiles = !navigator.canShare || navigator.canShare({ files: [file] })
        if (canFiles) {
          await navigator.share({
            title: 'FotoHabit · Progreso',
            text: shareText,
            files: [file],
          })
        } else {
          await navigator.share({
            title: 'FotoHabit · Progreso',
            text: shareText,
            url: shareUrl(),
          })
        }
        setNotice('Listo para Instagram, WhatsApp, TikTok…')
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        setNotice('Compartir nativo no disponible · imagen guardada')
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
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
      const blob = await buildProgressBlob(data)
      if (!blob) throw new Error('fail')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fotohabit-progreso-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
      setNotice('Imagen guardada')
    } catch {
      setNotice('No se pudo guardar')
    } finally {
      setBusy(null)
      window.setTimeout(() => setNotice(null), 2800)
    }
  }, [data])

  if (!open) return null

  const maxBar = Math.max(1, ...data.weeklyBars.map((b) => b.value))

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-4 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-progress-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-3xl border border-neon-cyan/30 bg-card/95 p-5 shadow-[0_0_60px_-16px_var(--color-neon-cyan)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-yellow">
              Compartir
            </p>
            <h2 id="share-progress-title" className="text-xl font-semibold text-foreground">
              Tu progreso ⚡
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tarjeta 9:16 lista para Stories e Instagram.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* 9:16 live preview */}
        <div
          className={cn(
            'relative mx-auto w-full max-w-[240px] overflow-hidden rounded-3xl border border-neon-cyan/40',
            'aspect-[9/16] bg-zinc-950 shadow-[0_0_40px_-10px_var(--color-neon-cyan)]',
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/15 via-transparent to-neon-fuchsia/20" />
          <div className="absolute inset-0 flex flex-col p-3.5">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/fotohabito-isotype.jpg?v=fotohabit-2"
                alt=""
                className="size-7 rounded-full object-cover shadow-[0_0_12px_-2px_rgba(0,240,255,0.5)]"
              />
              <div>
                <p className="text-xs font-bold text-neon-cyan">FotoHabit</p>
                <p className="font-mono text-[7px] uppercase tracking-wider text-neon-fuchsia">
                  {HABIT_MOTTO}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-yellow p-[2px]">
                <div className="flex size-full items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-white">
                  {data.initials}
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{data.displayName}</p>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/50">
                Mi progreso
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="rounded-xl border border-neon-yellow/40 bg-neon-yellow/10 px-2 py-1.5">
                <p className="font-mono text-[7px] uppercase text-neon-yellow">Racha</p>
                <p className="text-lg font-bold tabular-nums text-white">
                  {data.longestStreak}d
                </p>
              </div>
              <div className="rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-1.5">
                <p className="font-mono text-[7px] uppercase text-neon-cyan">21 días</p>
                <p className="text-lg font-bold tabular-nums text-white">
                  {data.successRate}%
                </p>
              </div>
            </div>

            <div className="mt-2 flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <p className="mb-1.5 font-mono text-[7px] uppercase tracking-wider text-neon-cyan">
                Constancia
              </p>
              <div className="flex h-14 items-end gap-0.5">
                {data.weeklyBars.map((bar) => (
                  <div
                    key={bar.label}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-neon-cyan/40 to-neon-lime"
                    style={{
                      height: `${Math.max(12, Math.round((bar.value / maxBar) * 100))}%`,
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-0.5">
                {data.heatDays.slice(0, 14).map((cell) => (
                  <span
                    key={cell.day}
                    className={cn(
                      'aspect-square rounded-[2px]',
                      cell.intensity === 0 && 'bg-white/10',
                      cell.intensity === 1 && 'bg-neon-cyan/30',
                      cell.intensity === 2 && 'bg-neon-cyan/55',
                      cell.intensity === 3 && 'bg-neon-cyan',
                    )}
                  />
                ))}
              </div>
            </div>

            <p className="mt-2 text-center font-mono text-[8px] text-white/55">
              FotoHabit · {data.totalFueguitos} 🔥
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void runShare()}
          disabled={busy !== null}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neon-yellow text-sm font-bold uppercase tracking-wide text-background shadow-[0_0_28px_-6px_var(--color-neon-yellow)] transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {busy === 'share' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Share2 className="size-4" aria-hidden="true" />
          )}
          Compartir progreso
        </button>

        <button
          type="button"
          onClick={() => void runDownload()}
          disabled={busy !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-foreground disabled:opacity-60"
        >
          {busy === 'download' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          Guardar imagen
        </button>

        {notice ? (
          <p role="status" className="text-center font-mono text-[10px] text-neon-lime">
            {notice}
          </p>
        ) : (
          <p className="inline-flex items-center justify-center gap-1 text-center font-mono text-[10px] text-muted-foreground">
            <Zap className="size-3 text-neon-yellow" aria-hidden="true" />
            WhatsApp · Instagram · TikTok vía Web Share
          </p>
        )}
      </div>
    </div>
  )
}
