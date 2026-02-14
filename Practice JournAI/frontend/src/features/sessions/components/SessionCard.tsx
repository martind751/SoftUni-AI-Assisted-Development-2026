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

const statusStyles = {
  planned: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-600',
} as const

const statusLabels = {
  planned: 'Planned',
  completed: 'Completed',
  skipped: 'Skipped',
} as const

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: session.id }}
      className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">
              {session.description}
            </h3>
            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[session.status]}`}
            >
              {statusLabels[session.status]}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            {session.duration_minutes && (
              <span>{session.duration_minutes} min</span>
            )}
            {session.energy_level && (
              <span>Energy: {session.energy_level}/5</span>
            )}
            {session.notes.length > 0 && (
              <span>
                {session.notes.length} note{session.notes.length !== 1 && 's'}
              </span>
            )}
          </div>
        </div>
        <time className="shrink-0 text-sm text-muted-foreground">
          {formatDate(session.due_date)}
        </time>
      </div>
    </Link>
  )
}
