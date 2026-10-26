'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './auth-context'
import {
  fetchMyNetwork,
  relationFromSnapshot,
  removeConnection,
  respondToConnection,
  searchProfiles,
  sendConnectionRequest,
  type NetworkSnapshot,
  type RelationToUser,
} from '@/lib/supabase/connections'
import type { CommunityUser } from '@/lib/community-data'

type NetworkContextValue = {
  loading: boolean
  error: string | null
  snapshot: NetworkSnapshot
  connectedIds: Set<string>
  incomingCount: number
  refreshNetwork: () => Promise<void>
  sendRequest: (userId: string) => Promise<void>
  acceptRequest: (connectionId: string) => Promise<void>
  rejectRequest: (connectionId: string) => Promise<void>
  disconnect: (connectionId: string) => Promise<void>
  relationTo: (userId: string) => RelationToUser
  searchPeople: (query: string) => Promise<CommunityUser[]>
}

const EMPTY: NetworkSnapshot = {
  accepted: [],
  incoming: [],
  outgoing: [],
  connectedIds: [],
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [snapshot, setSnapshot] = useState<NetworkSnapshot>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshNetwork = useCallback(async () => {
    if (!user?.id) {
      setSnapshot(EMPTY)
      return
    }
    setLoading(true)
    try {
      const next = await fetchMyNetwork(user.id)
      setSnapshot(next)
      setError(null)
    } catch (err) {
      console.error('[network]', err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar Mi Red')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setSnapshot(EMPTY)
      return
    }
    void refreshNetwork()
  }, [isAuthenticated, user?.id, refreshNetwork])

  const sendRequest = useCallback(
    async (userId: string) => {
      await sendConnectionRequest(userId)
      await refreshNetwork()
    },
    [refreshNetwork],
  )

  const acceptRequest = useCallback(
    async (connectionId: string) => {
      await respondToConnection(connectionId, 'accept')
      await refreshNetwork()
    },
    [refreshNetwork],
  )

  const rejectRequest = useCallback(
    async (connectionId: string) => {
      await respondToConnection(connectionId, 'reject')
      await refreshNetwork()
    },
    [refreshNetwork],
  )

  const disconnect = useCallback(
    async (connectionId: string) => {
      await removeConnection(connectionId)
      await refreshNetwork()
    },
    [refreshNetwork],
  )

  const relationTo = useCallback(
    (userId: string): RelationToUser => {
      if (!user?.id) return { kind: 'none' }
      return relationFromSnapshot(snapshot, user.id, userId)
    },
    [snapshot, user?.id],
  )

  const searchPeople = useCallback(
    async (query: string) => {
      if (!user?.id) return []
      return searchProfiles(query, user.id)
    },
    [user?.id],
  )

  const connectedIds = useMemo(
    () => new Set(snapshot.connectedIds),
    [snapshot.connectedIds],
  )

  const value = useMemo(
    () => ({
      loading,
      error,
      snapshot,
      connectedIds,
      incomingCount: snapshot.incoming.length,
      refreshNetwork,
      sendRequest,
      acceptRequest,
      rejectRequest,
      disconnect,
      relationTo,
      searchPeople,
    }),
    [
      loading,
      error,
      snapshot,
      connectedIds,
      refreshNetwork,
      sendRequest,
      acceptRequest,
      rejectRequest,
      disconnect,
      relationTo,
      searchPeople,
    ],
  )

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
