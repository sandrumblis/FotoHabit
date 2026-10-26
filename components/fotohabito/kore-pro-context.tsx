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
import type { KoreProPlanId } from '@/lib/kore-pro'

const STORAGE_KEY = 'kore.pro.subscription'

type StoredPro = {
  isPro: boolean
  planId: KoreProPlanId | null
}

type ProModalState = {
  title: string
  description?: string
  reason?: 'limit' | 'feature' | 'category'
} | null

type KoreProContextValue = {
  isPro: boolean
  planId: KoreProPlanId | null
  subscribe: (planId: KoreProPlanId) => void
  cancelPro: () => void
  proModal: ProModalState
  openProModal: (state: NonNullable<ProModalState>) => void
  closeProModal: () => void
}

const KoreProContext = createContext<KoreProContextValue | null>(null)

function readStored(): StoredPro {
  if (typeof window === 'undefined') return { isPro: false, planId: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { isPro: false, planId: null }
    const parsed = JSON.parse(raw) as StoredPro
    return {
      isPro: Boolean(parsed.isPro),
      planId: parsed.planId ?? null,
    }
  } catch {
    return { isPro: false, planId: null }
  }
}

function writeStored(next: StoredPro) {
  try {
    if (!next.isPro) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* noop */
  }
}

export function KoreProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false)
  const [planId, setPlanId] = useState<KoreProPlanId | null>(null)
  const [proModal, setProModal] = useState<ProModalState>(null)

  useEffect(() => {
    const stored = readStored()
    setIsPro(stored.isPro)
    setPlanId(stored.planId)
  }, [])

  const subscribe = useCallback((nextPlan: KoreProPlanId) => {
    setIsPro(true)
    setPlanId(nextPlan)
    writeStored({ isPro: true, planId: nextPlan })
    setProModal(null)
  }, [])

  const cancelPro = useCallback(() => {
    setIsPro(false)
    setPlanId(null)
    writeStored({ isPro: false, planId: null })
  }, [])

  const openProModal = useCallback((state: NonNullable<ProModalState>) => {
    setProModal(state)
  }, [])

  const closeProModal = useCallback(() => setProModal(null), [])

  const value = useMemo(
    () => ({
      isPro,
      planId,
      subscribe,
      cancelPro,
      proModal,
      openProModal,
      closeProModal,
    }),
    [isPro, planId, subscribe, cancelPro, proModal, openProModal, closeProModal],
  )

  return <KoreProContext.Provider value={value}>{children}</KoreProContext.Provider>
}

export function useKorePro() {
  const ctx = useContext(KoreProContext)
  if (!ctx) {
    throw new Error('useKorePro must be used within KoreProProvider')
  }
  return ctx
}
