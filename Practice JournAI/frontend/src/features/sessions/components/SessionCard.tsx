import { Link } from '@tanstack/react-router'
import type { Session } from '../types/session.types'

interface SessionCardProps {
  session: Session
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: session.id }}
      className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{session.description}</h3>
          {session.notes && (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {session.notes}
            </p>
          )}
        </div>
        <time className="shrink-0 text-sm text-muted-foreground">
          {formatDate(session.due_date)}
        </time>
      </div>
    </Link>
  )
}
