'use client'

import { AnalyticsDashboard } from './analytics-dashboard'
import { AppNavProvider, useAppNav } from './app-nav-context'
import { AuthProvider, useAuth } from './auth-context'
import { AuthScreen } from './auth-screen'
import { BrandLogo } from './brand-logo'
import { DashboardHeader } from './dashboard-header'
import { ExploreObjectivesProvider } from './explore-objectives-context'
import { HabitProgressProvider } from './habit-progress-context'
import { HomeSocial } from './home-social'
import { KoreProProvider, useKorePro } from './kore-pro-context'
import { NewUserOnboarding } from './new-user-onboarding'
import { ProfileSettingsProvider } from './profile-settings-context'
import { ProfileSettingsModal } from './profile-settings-modal'
import { ProUnlockModal } from './pro-unlock-modal'
import { SocialFeedProvider } from './social-feed-context'
import { cn } from '@/lib/utils'

function MainContent() {
  const { view } = useAppNav()
  const { proModal, closeProModal } = useKorePro()

  return (
    <div className="min-h-dvh bg-background">
      <NewUserOnboarding />
      <DashboardHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-10">
        <div className={cn(view === 'analytics' && 'hidden')}>
          <HomeSocial />
        </div>
        {view === 'analytics' ? <AnalyticsDashboard /> : null}
      </main>

      <ProfileSettingsModal />
      <ProUnlockModal
        open={proModal !== null}
        title={proModal?.title ?? ''}
        description={proModal?.description}
        reason={proModal?.reason}
        onClose={closeProModal}
      />
    </div>
  )
}

function AuthenticatedApp() {
  return (
    <HabitProgressProvider>
      <SocialFeedProvider>
        <ProfileSettingsProvider>
          <KoreProProvider>
            <ExploreObjectivesProvider>
              <AppNavProvider>
                <MainContent />
              </AppNavProvider>
            </ExploreObjectivesProvider>
          </KoreProProvider>
        </ProfileSettingsProvider>
      </SocialFeedProvider>
    </HabitProgressProvider>
  )
}

function AuthGate() {
  const { ready, isAuthenticated } = useAuth()

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size="sm" className="animate-pulse justify-center" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <AuthScreen />
  return <AuthenticatedApp />
}

export function AppShell() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
