'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AppMainView = 'community' | 'objectives' | 'analytics'

type AppNavContextValue = {
  view: AppMainView
  setView: (view: AppMainView) => void
}

const AppNavContext = createContext<AppNavContextValue | null>(null)

export function AppNavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppMainView>('community')

  const value = useMemo(
    () => ({
      view,
      setView,
    }),
    [view],
  )

  return <AppNavContext.Provider value={value}>{children}</AppNavContext.Provider>
}

export function useAppNav() {
  const ctx = useContext(AppNavContext)
  if (!ctx) throw new Error('useAppNav must be used within AppNavProvider')
  return ctx
}
