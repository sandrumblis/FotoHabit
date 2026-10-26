import { createClient } from './client'
import type { ProfileRow } from './database.types'
import { profileToCommunityUser } from './mappers'
import type { CommunityUser } from '@/lib/community-data'

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected'

export type ConnectionRow = {
  id: string
  requester_id: string
  addressee_id: string
  status: ConnectionStatus
  created_at: string
  updated_at: string
}

export type ConnectionWithPeer = {
  connection: ConnectionRow
  peer: CommunityUser
  /** incoming = te enviaron solicitud; outgoing = tú la enviaste */
  direction: 'incoming' | 'outgoing'
}

export type NetworkSnapshot = {
  accepted: ConnectionWithPeer[]
  incoming: ConnectionWithPeer[]
  outgoing: ConnectionWithPeer[]
  /** IDs de perfiles con conexión aceptada (sin incluirte). */
  connectedIds: string[]
}

function asStatus(value: string): ConnectionStatus {
  if (value === 'accepted' || value === 'rejected' || value === 'pending') return value
  return 'pending'
}

async function hydratePeers(
  rows: ConnectionRow[],
  myId: string,
): Promise<ConnectionWithPeer[]> {
  if (rows.length === 0) return []
  const peerIds = [
    ...new Set(
      rows.map((r) => (r.requester_id === myId ? r.addressee_id : r.requester_id)),
    ),
  ]
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, level, created_at')
    .in('id', peerIds)

  if (error) {
    console.error('[connections] hydrate peers', error)
    throw new Error(error.message)
  }

  const byId = new Map(
    ((data as ProfileRow[] | null) ?? []).map((p) => [p.id, p]),
  )

  return rows
    .map((connection) => {
      const peerId =
        connection.requester_id === myId
          ? connection.addressee_id
          : connection.requester_id
      const profile = byId.get(peerId)
      if (!profile) return null
      const direction: 'incoming' | 'outgoing' =
        connection.addressee_id === myId ? 'incoming' : 'outgoing'
      return {
        connection,
        peer: profileToCommunityUser(profile),
        direction,
      }
    })
    .filter((x): x is ConnectionWithPeer => Boolean(x))
}

export async function fetchMyNetwork(userId: string): Promise<NetworkSnapshot> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('connections')
    .select('id, requester_id, addressee_id, status, created_at, updated_at')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[connections] fetch', error)
    // Tabla ausente: red vacía sin romper la app.
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { accepted: [], incoming: [], outgoing: [], connectedIds: [] }
    }
    throw new Error(error.message)
  }

  const rows = ((data as ConnectionRow[] | null) ?? []).map((r) => ({
    ...r,
    status: asStatus(r.status),
  }))

  const acceptedRows = rows.filter((r) => r.status === 'accepted')
  const pendingRows = rows.filter((r) => r.status === 'pending')
  const incomingRows = pendingRows.filter((r) => r.addressee_id === userId)
  const outgoingRows = pendingRows.filter((r) => r.requester_id === userId)

  const [accepted, incoming, outgoing] = await Promise.all([
    hydratePeers(acceptedRows, userId),
    hydratePeers(incomingRows, userId),
    hydratePeers(outgoingRows, userId),
  ])

  const connectedIds = accepted.map((a) => a.peer.id)

  return { accepted, incoming, outgoing, connectedIds }
}

export async function searchProfiles(
  query: string,
  excludeUserId: string,
  limit = 12,
): Promise<CommunityUser[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, level, created_at')
    .ilike('username', `%${q}%`)
    .neq('id', excludeUserId)
    .limit(limit)

  if (error) {
    console.error('[connections] search', error)
    throw new Error(error.message)
  }

  return ((data as ProfileRow[] | null) ?? []).map((p) => profileToCommunityUser(p))
}

export async function sendConnectionRequest(addresseeId: string) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Debes iniciar sesión')
  if (addresseeId === userId) throw new Error('No puedes conectarte contigo mismo')

  // ¿Ya existe relación en cualquier dirección?
  const { data: existing } = await supabase
    .from('connections')
    .select('id, requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${userId})`,
    )
    .maybeSingle()

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('Ya estáis conectados en Mi Red')
    }
    if (existing.status === 'pending') {
      throw new Error('Ya hay una solicitud pendiente')
    }
    // rejected → reabrir como nueva solicitud desde este usuario
    const { error: updError } = await supabase
      .from('connections')
      .update({
        requester_id: userId,
        addressee_id: addresseeId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (updError) throw new Error(updError.message)
    return existing.id as string
  }

  const { data, error } = await supabase
    .from('connections')
    .insert({
      requester_id: userId,
      addressee_id: addresseeId,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'No se pudo enviar la solicitud')
  return data.id as string
}

export async function respondToConnection(
  connectionId: string,
  action: 'accept' | 'reject',
) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Debes iniciar sesión')

  const status: ConnectionStatus = action === 'accept' ? 'accepted' : 'rejected'
  const { error } = await supabase
    .from('connections')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', connectionId)
    .eq('addressee_id', userId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
}

export async function removeConnection(connectionId: string) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Debes iniciar sesión')

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) throw new Error(error.message)
}

export type RelationToUser =
  | { kind: 'self' }
  | { kind: 'none' }
  | { kind: 'connected'; connectionId: string }
  | { kind: 'outgoing'; connectionId: string }
  | { kind: 'incoming'; connectionId: string }

export function relationFromSnapshot(
  snapshot: NetworkSnapshot,
  myId: string,
  otherId: string,
): RelationToUser {
  if (myId === otherId) return { kind: 'self' }
  const accepted = snapshot.accepted.find((c) => c.peer.id === otherId)
  if (accepted) return { kind: 'connected', connectionId: accepted.connection.id }
  const outgoing = snapshot.outgoing.find((c) => c.peer.id === otherId)
  if (outgoing) return { kind: 'outgoing', connectionId: outgoing.connection.id }
  const incoming = snapshot.incoming.find((c) => c.peer.id === otherId)
  if (incoming) return { kind: 'incoming', connectionId: incoming.connection.id }
  return { kind: 'none' }
}
