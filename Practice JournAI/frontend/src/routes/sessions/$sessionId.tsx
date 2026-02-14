import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  useSession,
  useUpdateSession,
  useDeleteSession,
} from '../../features/sessions/hooks/useSessions'
import { SessionForm } from '../../features/sessions/components/SessionForm'
import { Button } from '../../components/ui/button'

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
              notes: session.notes,
            }}
            onSubmit={(data) => {
              updateSession.mutate(
                { id: sessionId, input: data },
                {
                  onSuccess: () => {
                    setIsEditing(false)
                  },
                },
              )
            }}
            isSubmitting={updateSession.isPending}
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
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-2xl font-semibold">{session.description}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Due: {formatDate(session.due_date)}
            </p>
            {session.notes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Notes
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-foreground">
                  {session.notes}
                </p>
              </div>
            )}
            <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              <p>Created: {formatDateTime(session.created_at)}</p>
              <p>Updated: {formatDateTime(session.updated_at)}</p>
            </div>
          </div>

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
