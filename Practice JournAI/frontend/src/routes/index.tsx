import { createFileRoute } from '@tanstack/react-router'
import { useHealthCheck } from '../features/health/hooks/useHealthCheck'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isLoading, isError, error } = useHealthCheck()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">System Health</h2>

      {isLoading && (
        <div className="rounded-lg border border-border p-6">
          <p className="text-muted-foreground">Checking system health...</p>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="font-medium text-destructive">Failed to reach backend</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      )}

      {data && (
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'inline-block size-3 rounded-full',
                data.status === 'ok' ? 'bg-green-500' : 'bg-red-500',
              )}
            />
            <span className="font-medium">
              Status: {data.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Timestamp: {data.timestamp}
          </p>
          {data.error && (
            <p className="mt-1 text-sm text-destructive">{data.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
