import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreateSession } from '../../features/sessions/hooks/useSessions'
import { SessionForm } from '../../features/sessions/components/SessionForm'

export const Route = createFileRoute('/sessions/new')({
  component: NewSessionPage,
})

function NewSessionPage() {
  const navigate = useNavigate()
  const createSession = useCreateSession()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">New Practice Session</h2>
      <SessionForm
        onSubmit={(data) => {
          createSession.mutate(data, {
            onSuccess: () => {
              void navigate({ to: '/sessions' })
            },
          })
        }}
        isSubmitting={createSession.isPending}
      />
      {createSession.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            Error: {createSession.error.message}
          </p>
        </div>
      )}
    </div>
  )
}
