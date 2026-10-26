'use client'

import { useState } from 'react'
import { Check, Loader2, Search, UserPlus, Users, X } from 'lucide-react'
import { CommunityAvatar } from './community-avatar'
import { useNetwork } from './network-context'
import type { CommunityUser } from '@/lib/community-data'
import { cn } from '@/lib/utils'

type NetworkPanelProps = {
  onSelectUser: (user: CommunityUser) => void
}

export function NetworkPanel({ onSelectUser }: NetworkPanelProps) {
  const {
    snapshot,
    loading,
    error,
    incomingCount,
    sendRequest,
    acceptRequest,
    rejectRequest,
    searchPeople,
    relationTo,
  } = useNetwork()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CommunityUser[]>([])
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function runSearch(value: string) {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const next = await searchPeople(value)
      setResults(next)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo buscar')
      window.setTimeout(() => setToast(null), 4000)
    } finally {
      setSearching(false)
    }
  }

  async function handleSend(userId: string) {
    setBusyId(userId)
    try {
      await sendRequest(userId)
      setToast('Solicitud de conexión enviada')
      window.setTimeout(() => setToast(null), 3200)
      if (query.trim().length >= 2) {
        const next = await searchPeople(query)
        setResults(next)
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo enviar')
      window.setTimeout(() => setToast(null), 4000)
    } finally {
      setBusyId(null)
    }
  }

  async function handleAccept(connectionId: string) {
    setBusyId(connectionId)
    try {
      await acceptRequest(connectionId)
      setToast('Conexión aceptada · ya estáis en Mi Red')
      window.setTimeout(() => setToast(null), 3200)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo aceptar')
      window.setTimeout(() => setToast(null), 4000)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(connectionId: string) {
    setBusyId(connectionId)
    try {
      await rejectRequest(connectionId)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo rechazar')
      window.setTimeout(() => setToast(null), 4000)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/50 p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
            Conexiones mutuas
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Mi Red
          </h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Solo verás aquí las publicaciones de personas con las que ya tenéis
            conexión aceptada por ambas partes.
          </p>
        </div>
        {incomingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-yellow/40 bg-neon-yellow/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-neon-yellow">
            {incomingCount} solicitud{incomingCount === 1 ? '' : 'es'}
          </span>
        ) : null}
      </header>

      {toast ? (
        <p
          role="status"
          className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-center text-xs text-neon-cyan"
        >
          {toast}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => void runSearch(e.target.value)}
          placeholder="Buscar perfiles por nombre…"
          className="h-11 w-full rounded-2xl border border-white/10 bg-background/60 pl-10 pr-3 text-sm text-foreground outline-none ring-neon-cyan/40 placeholder:text-muted-foreground focus:border-neon-cyan/40 focus:ring-2"
        />
      </label>

      {searching ? (
        <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Buscando…
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((person) => {
            const rel = relationTo(person.id)
            return (
              <li
                key={person.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/40 px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => onSelectUser(person)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <CommunityAvatar
                    initials={person.initials}
                    src={person.avatarUrl}
                    accent={person.accent}
                    size="sm"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {person.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {rel.kind === 'connected'
                        ? 'En tu red'
                        : rel.kind === 'outgoing'
                          ? 'Solicitud enviada'
                          : rel.kind === 'incoming'
                            ? 'Te envió solicitud'
                            : 'Sin conexión'}
                    </span>
                  </span>
                </button>
                {rel.kind === 'none' ? (
                  <button
                    type="button"
                    disabled={busyId === person.id}
                    onClick={() => void handleSend(person.id)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 text-[11px] font-semibold text-neon-cyan disabled:opacity-50"
                  >
                    {busyId === person.id ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <UserPlus className="size-3.5" aria-hidden="true" />
                    )}
                    Conectar
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      {snapshot.incoming.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-yellow">
            Solicitudes pendientes
          </p>
          <ul className="flex flex-col gap-2">
            {snapshot.incoming.map(({ connection, peer }) => (
              <li
                key={connection.id}
                className="flex items-center gap-3 rounded-2xl border border-neon-yellow/25 bg-neon-yellow/5 px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => onSelectUser(peer)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <CommunityAvatar
                    initials={peer.initials}
                    src={peer.avatarUrl}
                    accent={peer.accent}
                    size="sm"
                  />
                  <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                    {peer.name}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={busyId === connection.id}
                  onClick={() => void handleAccept(connection.id)}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-neon-lime/40 bg-neon-lime/10 text-neon-lime disabled:opacity-50"
                  aria-label={`Aceptar a ${peer.name}`}
                >
                  <Check className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={busyId === connection.id}
                  onClick={() => void handleReject(connection.id)}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 text-muted-foreground hover:text-red-300 disabled:opacity-50"
                  aria-label={`Rechazar a ${peer.name}`}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Users className="size-3" aria-hidden="true" />
          Conexiones aceptadas ({snapshot.accepted.length})
        </p>
        {loading && snapshot.accepted.length === 0 ? (
          <p className="text-xs text-muted-foreground">Cargando tu red…</p>
        ) : snapshot.accepted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-muted-foreground">
            Aún no tienes conexiones. Busca perfiles y envía una solicitud.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {snapshot.accepted.map(({ peer }) => (
              <li key={peer.id}>
                <button
                  type="button"
                  onClick={() => onSelectUser(peer)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/50 py-1 pl-1 pr-3',
                    'transition hover:border-neon-cyan/40',
                  )}
                >
                  <CommunityAvatar
                    initials={peer.initials}
                    src={peer.avatarUrl}
                    accent={peer.accent}
                    size="sm"
                  />
                  <span className="max-w-[7rem] truncate text-xs font-medium text-foreground">
                    {peer.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
