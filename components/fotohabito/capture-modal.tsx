'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  Camera,
  Check,
  Flame,
  Globe2,
  ImagePlus,
  Loader2,
  Lock,
  RefreshCw,
  SwitchCamera,
  X,
} from 'lucide-react'
import { ShareAchievement } from './share-achievement'
import { useHabitProgress } from './habit-progress-context'
import { localTodayKey } from '@/lib/daily-validation'
import { getLevelForDay } from '@/lib/habit-levels'
import { cn } from '@/lib/utils'

export type CapturePrivacy = 'private' | 'public'

export type CaptureChallengeContext = {
  title: string
  description: string
  day?: number
  categoryId?: string
  objective?: string
  maintenance?: boolean
}

export type CaptureResult = {
  fileName: string
  previewUrl: string
  /** Archivo original para subir a Supabase (evita blob: URL revocada → Failed to fetch). */
  imageFile?: File | null
  caption: string
  privacy: CapturePrivacy
  valid: boolean
  message: string
  day?: number
  categoryId?: string
}

type CaptureModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (result: CaptureResult) => void
  challenge?: CaptureChallengeContext | null
}

type Step = 'camera' | 'preview' | 'scanning' | 'success' | 'error'

type FacingMode = 'environment' | 'user'

export function CaptureModal({ open, onClose, onConfirm, challenge }: CaptureModalProps) {
  const { canValidateToday, dailyValidationMessage, hasCompletedDailyHabit } = useHabitProgress()
  const titleId = useId()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraFileRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null)

  const [step, setStep] = useState<Step>('camera')
  const [facing, setFacing] = useState<FacingMode>('environment')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [privacy, setPrivacy] = useState<CapturePrivacy>('public')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingResult, setPendingResult] = useState<CaptureResult | null>(null)
  /** previewUrl entregado al padre: no revocar en cleanup. */
  const transferredPreviewRef = useRef<string | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraReady(false)
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startCamera = useCallback(async (mode: FacingMode) => {
    setCameraError(null)
    setCameraReady(false)
    stopCamera()

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Este dispositivo no permite acceso directo a la cámara. Usa la galería o el botón de foto nativo.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => undefined)
      }
      setCameraReady(true)
    } catch {
      setCameraError(
        'No pudimos acceder a la cámara. Concede el permiso o elige una foto de la galería.',
      )
    }
  }, [stopCamera])

  useEffect(() => {
    if (!open) return
    setStep('camera')
    setCaption('')
    setPrivacy('public')
    setErrorMessage(null)
    setSuccessMessage(null)
    setPendingResult(null)
    void startCamera(facing)

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init camera only when modal opens
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'scanning') {
        stopCamera()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, step, onClose, stopCamera])

  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl.startsWith('blob:') &&
        previewUrl !== transferredPreviewRef.current
      ) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!open) return null

  function resetMedia() {
    if (
      previewUrl &&
      previewUrl.startsWith('blob:') &&
      previewUrl !== transferredPreviewRef.current
    ) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setFileName(null)
    fileRef.current = null
    if (galleryRef.current) galleryRef.current.value = ''
    if (cameraFileRef.current) cameraFileRef.current.value = ''
  }

  function handleClose() {
    if (step === 'scanning') return
    stopCamera()
    resetMedia()
    setStep('camera')
    setErrorMessage(null)
    setSuccessMessage(null)
    setPendingResult(null)
    onClose()
  }

  function acceptFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    fileRef.current = file
    setPreviewUrl(URL.createObjectURL(file))
    setFileName(file.name || `fotohabit-${Date.now()}.jpg`)
    setErrorMessage(null)
    stopCamera()
    setStep('preview')
  }

  async function snapPhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraReady) return

    const w = video.videoWidth || 1080
    const h = video.videoHeight || 1080
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    )
    if (!blob) return
    const file = new File([blob], `fotohabit-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    acceptFile(file)
  }

  async function flipCamera() {
    const next: FacingMode = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    await startCamera(next)
  }

  async function validateWithAI() {
    const file = fileRef.current
    if (!previewUrl || !fileName || !file) return

    if (!canValidateToday() || hasCompletedDailyHabit) {
      setErrorMessage(dailyValidationMessage)
      setStep('error')
      return
    }

    setStep('scanning')
    setErrorMessage(null)

    const challengeTitle = challenge?.title?.trim() || 'Reto del día'
    const challengeDescription =
      challenge?.description?.trim() ||
      caption.trim() ||
      'Prueba fotográfica del hábito diario'

    try {
      const form = new FormData()
      form.append('image', file)
      form.append('title', challengeTitle)
      form.append('description', challengeDescription)
      if (challenge?.day != null) form.append('day', String(challenge.day))
      if (challenge?.categoryId) form.append('categoryId', challenge.categoryId)
      if (challenge?.objective) form.append('objective', challenge.objective)
      if (challenge?.maintenance) form.append('mode', 'maintenance')
      form.append('clientDate', localTodayKey())

      const res = await fetch('/api/validate-photo', {
        method: 'POST',
        body: form,
      })

      const raw = await res.text()
      let data: {
        valid?: boolean
        message?: string
        softPass?: boolean
        blockedDaily?: boolean
      } = {}
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {}
      } catch {
        // Respuesta no JSON (HTML/proxy): soft-pass elegante, sin "Unexpected token".
        data = {
          valid: true,
          message:
            'No pudimos revisar la foto ahora mismo. La damos por válida para que no pierdas el día.',
          softPass: true,
        }
      }

      const PHOTO_MISMATCH = 'La foto no coincide con el reto de hoy, prueba de nuevo'

      if (data.blockedDaily || res.status === 409) {
        setPendingResult(null)
        setSuccessMessage(null)
        setErrorMessage(data.message?.trim() || dailyValidationMessage)
        setStep('error')
        return
      }

      const valid = data.valid !== false
      const message =
        data.message?.trim() ||
        (valid ? '¡Reto validado! Sigue con tu racha.' : PHOTO_MISMATCH)

      if (!valid) {
        setPendingResult(null)
        setSuccessMessage(null)
        setErrorMessage(
          data.message?.trim() === dailyValidationMessage
            ? dailyValidationMessage
            : PHOTO_MISMATCH,
        )
        setStep('error')
        return
      }

      const result: CaptureResult = {
        fileName,
        previewUrl,
        imageFile: file,
        caption: caption.trim(),
        privacy,
        valid: true,
        message: message.replace(/\bKore Habits\b/gi, 'FotoHabit').replace(/\bKore\b/gi, 'FotoHabit'),
        day: challenge?.day,
        categoryId: challenge?.categoryId,
      }
      setPendingResult(result)
      setSuccessMessage(result.message)
      setStep('success')
    } catch {
      // Red caída u otro fallo de cliente: aviso elegante + soft-pass.
      const result: CaptureResult = {
        fileName,
        previewUrl,
        imageFile: file,
        caption: caption.trim(),
        privacy,
        valid: true,
        message:
          'No pudimos revisar la foto ahora mismo. La damos por válida para que no pierdas el día.',
        day: challenge?.day,
        categoryId: challenge?.categoryId,
      }
      setPendingResult(result)
      setSuccessMessage(result.message)
      setStep('success')
    }
  }

  function retryCapture() {
    resetMedia()
    setErrorMessage(null)
    setStep('camera')
    void startCamera(facing)
  }

  function finishSuccess(nextPrivacy: CapturePrivacy = privacy) {
    if (!pendingResult) return
    // Seguridad: no confirmar si entre medias ya se validó otro reto hoy.
    if (hasCompletedDailyHabit) {
      setErrorMessage(dailyValidationMessage)
      setStep('error')
      return
    }
    const imageFile = fileRef.current ?? pendingResult.imageFile ?? null
    const final: CaptureResult = {
      ...pendingResult,
      imageFile,
      caption: caption.trim(),
      privacy: nextPrivacy,
    }
    // El padre posee previewUrl + File: no revocar el blob al limpiar estado.
    transferredPreviewRef.current = final.previewUrl
    setPreviewUrl(null)
    fileRef.current = null
    setPendingResult(null)
    stopCamera()
    onConfirm(final)
    onClose()
  }

  const dayLabel =
    challenge?.day != null ? `Día ${challenge.day}` : challenge?.objective ?? 'Hoy'

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        className="sr-only"
        onChange={(e) => acceptFile(e.target.files?.[0])}
      />
      <input
        ref={cameraFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => acceptFile(e.target.files?.[0])}
      />

      {/* Top bar */}
      <div className="relative z-20 flex items-start justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan">
            Validar con foto · {dayLabel}
          </p>
          <h2 id={titleId} className="mt-0.5 truncate text-base font-semibold text-white">
            {challenge?.title ?? 'Captura tu prueba'}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={step === 'scanning'}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md disabled:opacity-40"
          aria-label="Cerrar"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Stage */}
      <div className="relative min-h-0 flex-1">
        {step === 'camera' ? (
          <div className="absolute inset-0 bg-zinc-950">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={cn(
                'absolute inset-0 size-full object-cover',
                facing === 'user' && 'scale-x-[-1]',
                !cameraReady && 'opacity-0',
              )}
            />

            {/* Neon guide frame */}
            <div className="pointer-events-none absolute inset-6 sm:inset-10">
              <div className="absolute inset-0 rounded-[2rem] border border-neon-cyan/35 shadow-[0_0_40px_-12px_var(--color-neon-cyan),inset_0_0_40px_-20px_var(--color-neon-cyan)]" />
              <span className="absolute -left-0.5 -top-0.5 size-8 rounded-tl-2xl border-l-2 border-t-2 border-neon-cyan" />
              <span className="absolute -right-0.5 -top-0.5 size-8 rounded-tr-2xl border-r-2 border-t-2 border-neon-fuchsia" />
              <span className="absolute -bottom-0.5 -left-0.5 size-8 rounded-bl-2xl border-b-2 border-l-2 border-neon-lime" />
              <span className="absolute -bottom-0.5 -right-0.5 size-8 rounded-br-2xl border-b-2 border-r-2 border-neon-yellow" />
              <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
            </div>

            {!cameraReady && !cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="size-8 animate-spin text-neon-cyan" aria-hidden="true" />
                <p className="text-sm text-white/80">Solicitando acceso a la cámara…</p>
                <p className="max-w-xs text-xs text-white/50">
                  En iOS y Android concede el permiso cuando el navegador lo pida.
                </p>
              </div>
            ) : null}

            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="flex size-16 items-center justify-center rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan">
                  <Camera className="size-7" aria-hidden="true" />
                </span>
                <p className="max-w-sm text-sm leading-relaxed text-white/85">{cameraError}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void startCamera(facing)}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-neon-cyan/45 bg-neon-cyan/15 px-4 text-xs font-semibold text-neon-cyan"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Reintentar permiso
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraFileRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white"
                  >
                    <Camera className="size-3.5" aria-hidden="true" />
                    Cámara nativa
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-neon-lime/45 bg-neon-lime/15 px-4 text-xs font-semibold text-neon-lime"
                  >
                    <ImagePlus className="size-3.5" aria-hidden="true" />
                    Subir desde el dispositivo
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {(step === 'preview' ||
          step === 'scanning' ||
          step === 'success' ||
          step === 'error') &&
        previewUrl ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vista previa de la prueba"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />
          </div>
        ) : null}

        {step === 'scanning' ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-black/55 backdrop-blur-[2px]">
            <div className="relative flex size-28 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full border border-neon-cyan/40" />
              <span className="absolute inset-2 animate-pulse rounded-full border border-neon-fuchsia/50 shadow-[0_0_40px_-4px_var(--color-neon-fuchsia)]" />
              <span className="animate-fotohabit-scan absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_16px_var(--color-neon-cyan)]" />
              <Loader2 className="relative size-8 animate-spin text-neon-cyan" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white">Analizando prueba con IA…</p>
              <p className="mt-1 text-xs text-white/60">
                FotoHabit comprueba que la foto encaje con tu reto de hoy
              </p>
            </div>
          </div>
        ) : null}

        {step === 'success' ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end bg-black/55 p-3 backdrop-blur-[1px] sm:p-4">
            <div className="flex max-h-[min(92dvh,820px)] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl border border-neon-lime/40 bg-background/95 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_0_50px_-12px_var(--color-neon-lime)] sm:mb-4 sm:rounded-3xl sm:px-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-14 items-center justify-center rounded-full border border-neon-lime/50 bg-neon-lime/15 text-neon-lime shadow-[0_0_28px_-4px_var(--color-neon-lime)]">
                  <Check className="size-7 stroke-[3]" aria-hidden="true" />
                </span>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon-lime">
                  Validado
                </p>
                <h3 className="text-xl font-semibold text-foreground">¡Prueba aceptada!</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{successMessage}</p>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-neon-yellow/40 bg-neon-yellow/10 px-3 py-1 font-mono text-xs text-neon-yellow">
                  <Flame className="size-3.5 fill-neon-yellow" aria-hidden="true" />
                  +1 día · fueguito a tu racha
                </p>
              </div>

              <label className="w-full text-left">
                <span className="text-[11px] text-muted-foreground">Pie de foto (opcional)</span>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 200))}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-background/80 px-3 py-2 text-base text-foreground outline-none focus:border-neon-cyan/50 sm:text-sm"
                  placeholder="Comparte cómo te sentiste hoy…"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setPrivacy('public')
                  finishSuccess('public')
                }}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-neon-lime px-4 text-base font-bold text-background shadow-[0_0_40px_-4px_var(--color-neon-lime)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                <Globe2 className="size-5" aria-hidden="true" />
                Publicar en FotoHabit (Feed global)
              </button>
              <p className="-mt-2 text-center text-[11px] text-muted-foreground">
                Máximo protagonismo: tu prueba entra al feed de la comunidad
              </p>

              <button
                type="button"
                onClick={() => {
                  setPrivacy('private')
                  finishSuccess('private')
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <Lock className="size-4" aria-hidden="true" />
                Solo validar (sin publicar)
              </button>

              <details className="group border-t border-white/10 pt-3">
                <summary className="cursor-pointer list-none text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
                  <span className="inline-flex items-center gap-2">
                    Compartir en redes externas
                    <span className="text-white/30 group-open:hidden">▾</span>
                    <span className="hidden text-white/30 group-open:inline">▴</span>
                  </span>
                </summary>
                <div className="mt-3">
                  <ShareAchievement
                    compact
                    emphasis="secondary"
                    data={{
                      photoUrl: previewUrl,
                      habit: challenge?.objective || challenge?.title || 'Hábito',
                      level: getLevelForDay(Math.max(challenge?.day ?? 1, 1)),
                      streakDays: challenge?.day ?? 1,
                      title: '¡Prueba validada!',
                      subtitle: successMessage ?? undefined,
                    }}
                  />
                </div>
              </details>
            </div>
          </div>
        ) : null}

        {step === 'error' ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end bg-black/55 px-5 pb-6 backdrop-blur-[1px]">
            <div className="w-full max-w-md rounded-3xl border border-red-400/35 bg-background/95 p-5 text-center shadow-[0_0_40px_-12px_rgba(248,113,113,0.45)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-300">
                No validada
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">Prueba no aceptada</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {errorMessage}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={retryCapture}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neon-cyan text-sm font-semibold text-background shadow-[0_0_28px_-6px_var(--color-neon-cyan)]"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Cerrar por ahora
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom controls */}
      {step === 'camera' ? (
        <div className="relative z-20 space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neon-lime/40 bg-neon-lime/10 text-sm font-semibold text-neon-lime shadow-[0_0_24px_-8px_var(--color-neon-lime)]"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            Subir foto desde el dispositivo
          </button>

          <div className="flex items-center justify-between gap-4 px-1">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex size-12 flex-col items-center justify-center gap-0.5 rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md"
              aria-label="Subir imagen desde archivos del dispositivo"
              title="Archivos / galería"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => void snapPhoto()}
              disabled={!cameraReady}
              className="relative flex size-[4.5rem] items-center justify-center rounded-full border-4 border-neon-cyan bg-white shadow-[0_0_36px_-4px_var(--color-neon-cyan)] transition-transform enabled:hover:scale-105 disabled:opacity-40"
              aria-label="Capturar foto"
            >
              <span className="size-14 rounded-full bg-white ring-2 ring-black/10" />
            </button>

            <button
              type="button"
              onClick={() => void flipCamera()}
              disabled={!cameraReady}
              className="flex size-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md disabled:opacity-40"
              aria-label="Cambiar cámara"
            >
              <SwitchCamera className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {step === 'preview' ? (
        <div className="relative z-20 space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {challenge?.description ? (
            <p className="line-clamp-2 text-center text-xs text-white/70">
              {challenge.description}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white/90"
          >
            <ImagePlus className="size-3.5" aria-hidden="true" />
            Elegir otra imagen del dispositivo
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={retryCapture}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Cámara
            </button>
            <button
              type="button"
              onClick={() => void validateWithAI()}
              className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-neon-cyan text-sm font-semibold text-background shadow-[0_0_32px_-6px_var(--color-neon-cyan)]"
            >
              <Camera className="size-4" aria-hidden="true" />
              Validar con IA
            </button>
          </div>
        </div>
      ) : null}

    </div>
  )
}

