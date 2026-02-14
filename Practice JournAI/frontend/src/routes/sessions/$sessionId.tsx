import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  useSession,
  useUpdateSession,
  useDeleteSession,
} from '../../features/sessions/hooks/useSessions'
import { SessionForm } from '../../features/sessions/components/SessionForm'
import { SessionNotes } from '../../features/sessions/components/SessionNotes'
import { Button } from '../../components/ui/button'
import type { UpdateSessionInput } from '../../features/sessions/types/session.types'

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionDetailPage,
})

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const statusStyles = {
  planned: 'bg-primary/20 text-primary',
  completed: 'bg-accent/20 text-accent',
  skipped: 'bg-muted text-muted-foreground',
} as const

const statusLabels = {
  planned: 'Planned',
  completed: 'Completed',
  skipped: 'Skipped',
} as const

const genreLabels = {
  jazz: 'Jazz',
  blues: 'Blues',
  rock_metal: 'Rock/Metal',
} as const

function SessionDetailPage() {
  const { sessionId } = Route.useParams()
  const navigate = useNavigate()
  const { data: session, isLoading, isError, error } = useSession(sessionId)
  const updateSession = useUpdateSession()
  const deleteSession = useDeleteSession()
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg bg-muted p-4">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link
          to="/sessions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to sessions
        </Link>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return
    }
    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        void navigate({ to: '/sessions' })
      },
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/sessions"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to sessions
      </Link>

      {isEditing ? (
        <>
          <h2 className="text-2xl font-semibold">Edit Session</h2>
          <SessionForm
            defaultValues={{
              due_date: session.due_date,
              description: session.description,
              status: session.status,
              duration_minutes: session.duration_minutes,
              energy_level: session.energy_level,
            }}
            onSubmit={(data) => {
              updateSession.mutate(
                { id: sessionId, input: data as UpdateSessionInput },
                {
                  onSuccess: () => {
                    setIsEditing(false)
                  },
                },
              )
            }}
            isSubmitting={updateSession.isPending}
            isEdit
          />
          {updateSession.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="font-medium text-destructive">
                Error: {updateSession.error.message}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="border border-border p-6" style={{ borderRadius: 'var(--genre-radius-lg)', boxShadow: 'var(--genre-shadow)' }}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold">{session.description}</h2>
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[session.status]}`}
              >
                {statusLabels[session.status]}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Due: {formatDate(session.due_date)}</span>
              <span>Genre: {genreLabels[session.genre]}</span>
              {session.duration_minutes && (
                <span>{session.duration_minutes} min</span>
              )}
              {session.energy_level && (
                <span>Energy: {session.energy_level}/5</span>
              )}
            </div>

            <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              <p>Created: {formatDateTime(session.created_at)}</p>
              <p>Updated: {formatDateTime(session.updated_at)}</p>
            </div>
          </div>

          <SessionNotes sessionId={session.id} notes={session.notes} />

          <div className="flex items-center gap-3">
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSession.isPending}
            >
              {deleteSession.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>

          {deleteSession.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="font-medium text-destructive">
                Error: {deleteSession.error.message}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
