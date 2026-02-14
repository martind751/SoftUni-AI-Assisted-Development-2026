import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  useSongs,
  type SongOrderByField,
  type OrderDir,
} from '../../features/songs/hooks/useSongs'
import { SongCard } from '../../features/songs/components/SongCard'
import { Button } from '../../components/ui/button'
import { useGenre } from '../../contexts/GenreContext'

export const Route = createFileRoute('/songs/')({
  component: SongsPage,
})

const sortOptions: { value: SongOrderByField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'artist', label: 'Artist' },
  { value: 'created_at', label: 'Created' },
]

const BETA_DISMISSED_KEY = 'songs-beta-dismissed'

function BetaDisclaimer({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-xl border border-amber-500/30 bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-sm font-bold text-amber-600 dark:text-amber-400">
            Beta
          </span>
          <h3 className="text-lg font-semibold text-foreground">Songs Feature</h3>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          The Songs feature is currently in <strong className="text-foreground">beta</strong>. Song search is powered by MusicBrainz, an open-source music database.
        </p>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Search results may be incomplete, inaccurate, or missing popular tracks. You can always fill in song details manually.
        </p>
        <Button onClick={onDismiss} className="w-full">
          Got it, continue
        </Button>
      </div>
    </div>
  )
}

function SongsPage() {
  const { activeGenre } = useGenre()
  const [orderBy, setOrderBy] = useState<SongOrderByField>('title')
  const [orderDir, setOrderDir] = useState<OrderDir>('asc')
  const [showBetaDialog, setShowBetaDialog] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(BETA_DISMISSED_KEY)) {
      setShowBetaDialog(true)
    }
  }, [])

  function handleDismissBeta() {
    sessionStorage.setItem(BETA_DISMISSED_KEY, '1')
    setShowBetaDialog(false)
  }

  const { data: songs, isLoading, isError, error } = useSongs({
    genre: activeGenre === 'all' ? undefined : activeGenre,
    orderBy,
    orderDir,
  })

  return (
    <div className="space-y-6">
      {showBetaDialog && <BetaDisclaimer onDismiss={handleDismissBeta} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Practice Songs</h2>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Beta
          </span>
        </div>
        <Link to="/songs/new">
          <Button>New Song</Button>
        </Link>
      </div>

      {/* Sort Bar */}
      <div
        className="flex flex-wrap items-center gap-4 border border-border bg-card p-3 transition-all duration-500"
        style={{ borderRadius: 'var(--genre-radius-lg)' }}
      >
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
          {orderDir === 'asc' ? 'A to Z' : 'Z to A'}
        </button>
      </div>

      {isLoading && (
        <div className="animate-pulse rounded-lg bg-muted p-4">
          <p className="text-muted-foreground">Loading songs...</p>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            Error: {error.message}
          </p>
        </div>
      )}

      {songs && songs.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">
            No songs in your library yet. Add your first one!
          </p>
        </div>
      )}

      {songs && songs.length > 0 && (
        <div className="space-y-3">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  )
}
