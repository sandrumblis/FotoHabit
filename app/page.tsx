import { CaptureBanner } from '@/components/fotohabito/capture-banner'
import { DashboardHeader } from '@/components/fotohabito/dashboard-header'
import { HabitGrid } from '@/components/fotohabito/habit-grid'

export default function Page() {
  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Buenos días, Laura</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Una foto al día, un hábito para siempre.
          </h1>
        </div>
        <CaptureBanner />
        <HabitGrid />
      </main>
    </div>
  )
}
