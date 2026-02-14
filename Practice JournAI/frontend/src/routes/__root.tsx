import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { GenreProvider } from '../contexts/GenreContext'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <GenreProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border px-6 py-4">
          <nav className="flex items-center gap-6">
            <h1 className="text-xl font-bold">Practice JournAI</h1>
            <Link
              to="/sessions"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sessions
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-8">
          <Outlet />
        </main>
        <TanStackRouterDevtools position="bottom-right" />
      </div>
    </GenreProvider>
  )
}
