import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { GenreProvider } from '../contexts/GenreContext'
import { GenreSwitcher } from '../components/GenreSwitcher'
import { ThemeToggle } from '../components/ThemeToggle'
import { GenreBackground } from '../components/GenreBackground'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <GenreProvider>
      <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500">
        <GenreBackground />
        <div className="relative z-10">
          <header
            className="border-b px-6 py-4 transition-all duration-500"
            style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--genre-border-width, 1px)' }}
          >
            <nav className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold text-primary transition-all duration-500">
                  Practice JournAI
                </h1>
                <Link
                  to="/sessions"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sessions
                </Link>
                <Link
                  to="/songs"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Songs
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Beta
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <GenreSwitcher />
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-4xl px-6 py-8">
            <Outlet />
          </main>
        </div>
        <TanStackRouterDevtools position="bottom-right" />
      </div>
    </GenreProvider>
  )
}
