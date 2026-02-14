import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  useSessions,
  type OrderByField,
  type OrderDir,
} from '../../features/sessions/hooks/useSessions'
import { SessionCard } from '../../features/sessions/components/SessionCard'
import { Button } from '../../components/ui/button'
import { useGenre } from '../../contexts/GenreContext'
import type { SessionStatus } from '../../features/sessions/types/session.types'

export const Route = createFileRoute('/sessions/')({
  component: SessionsPage,
})

const statusOptions: { value: SessionStatus | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
]

const sortOptions: { value: OrderByField; label: string }[] = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'created_at', label: 'Created' },
]

function SessionsPage() {
  const { activeGenre } = useGenre()
  const [status, setStatus] = useState<SessionStatus | undefined>(undefined)
  const [orderBy, setOrderBy] = useState<OrderByField>('due_date')
  const [orderDir, setOrderDir] = useState<OrderDir>('asc')

  const { data: sessions, isLoading, isError, error } = useSessions({
    genre: activeGenre,
    status,
    orderBy,
    orderDir,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Practice Sessions</h2>
        <Link to="/sessions/new">
          <Button>New Session</Button>
        </Link>
      </div>

      {/* Filter & Sort Bar */}
      <div
        className="flex flex-wrap items-center gap-4 border border-border bg-card p-3 transition-all duration-500"
        style={{ borderRadius: 'var(--genre-radius-lg)' }}
      >
        {/* Status Filter */}
        <div
          className="flex gap-1 bg-muted p-1 transition-all duration-500"
          style={{ borderRadius: 'var(--genre-radius)' }}
        >
          {statusOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                status === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                borderRadius: 'var(--genre-radius)',
                boxShadow:
                  status === opt.value ? 'var(--genre-shadow)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Sort Field */}
        <div
          className="flex gap-1 bg-muted p-1 transition-all duration-500"
          style={{ borderRadius: 'var(--genre-radius)' }}
        >
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOrderBy(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                orderBy === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                borderRadius: 'var(--genre-radius)',
                boxShadow:
                  orderBy === opt.value ? 'var(--genre-shadow)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort Direction Toggle */}
        <button
          onClick={() => setOrderDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          title={orderDir === 'asc' ? 'Ascending' : 'Descending'}
        >
          <svg
            className="h-4 w-4 transition-transform duration-300"
            style={{ transform: orderDir === 'desc' ? 'rotate(180deg)' : 'none' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12l7-7 7 7" />
          </svg>
          {orderDir === 'asc' ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

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
