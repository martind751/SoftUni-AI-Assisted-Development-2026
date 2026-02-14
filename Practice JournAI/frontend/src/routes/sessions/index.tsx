import { createFileRoute, Link } from '@tanstack/react-router'
import { useSessions } from '../../features/sessions/hooks/useSessions'
import { SessionCard } from '../../features/sessions/components/SessionCard'
import { GenreSwitcher } from '../../components/GenreSwitcher'
import { Button } from '../../components/ui/button'
import { useGenre } from '../../contexts/GenreContext'

export const Route = createFileRoute('/sessions/')({
  component: SessionsPage,
})

function SessionsPage() {
  const { activeGenre } = useGenre()
  const { data: sessions, isLoading, isError, error } = useSessions({
    genre: activeGenre,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Practice Sessions</h2>
        <Link to="/sessions/new">
          <Button>New Session</Button>
        </Link>
      </div>

      <GenreSwitcher />

      {isLoading && (
        <div className="animate-pulse rounded-lg bg-muted p-4">
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            Error: {error.message}
          </p>
        </div>
      )}

      {sessions && sessions.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">
            No practice sessions yet. Create your first one!
          </p>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
