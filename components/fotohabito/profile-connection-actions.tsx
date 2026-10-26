'use client'

import { useState } from 'react'
import { Check, Loader2, UserMinus, UserPlus, X } from 'lucide-react'
import { useNetwork } from './network-context'
import { cn } from '@/lib/utils'

type ProfileConnectionActionsProps = {
  userId: string
  userName: string
  className?: string
}

export function ProfileConnectionActions({
  userId,
  userName,
  className,
}: ProfileConnectionActionsProps) {
  const { relationTo, sendRequest, acceptRequest, rejectRequest, disconnect } =
    useNetwork()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const relation = relationTo(userId)

  if (relation.kind === 'self') return null

  async function run(action: () => Promise<void>, okMsg?: string) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      if (okMsg) {
        setMessage(okMsg)
        window.setTimeout(() => setMessage(null), 3200)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Algo falló')
      window.setTimeout(() => setMessage(null), 4000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {relation.kind === 'none' ? (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(() => sendRequest(userId), 'Solicitud de conexión enviada')
          }
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 text-sm font-semibold text-neon-cyan disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="size-4" aria-hidden="true" />
          )}
          Solicitud de conexión
        </button>
      ) : null}

      {relation.kind === 'outgoing' ? (
        <p className="rounded-2xl border border-white/10 bg-background/50 px-3 py-2.5 text-center text-xs text-muted-foreground">
          Solicitud enviada · esperando respuesta de {userName}
        </p>
      ) : null}

      {relation.kind === 'incoming' ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                () => acceptRequest(relation.connectionId),
                'Conexión aceptada · ya estáis en Mi Red',
              )
            }
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-neon-lime/40 bg-neon-lime/10 text-sm font-semibold text-neon-lime disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden="true" />
            Aceptar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => rejectRequest(relation.connectionId))}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/15 text-sm font-semibold text-muted-foreground hover:text-red-300 disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
            Rechazar
          </button>
        </div>
      ) : null}

      {relation.kind === 'connected' ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => disconnect(relation.connectionId))}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-background/40 text-sm font-semibold text-muted-foreground hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserMinus className="size-4" aria-hidden="true" />
          )}
          En Mi Red · Desconectar
        </button>
      ) : null}

      {message ? (
        <p role="status" className="text-center font-mono text-[11px] text-neon-cyan">
          {message}
        </p>
      ) : null}
    </div>
  )
}
