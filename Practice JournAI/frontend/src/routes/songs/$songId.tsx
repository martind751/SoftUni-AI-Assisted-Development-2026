import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  useSong,
  useUpdateSong,
  useDeleteSong,
} from '../../features/songs/hooks/useSongs'
import { SongForm } from '../../features/songs/components/SongForm'
import { Button } from '../../components/ui/button'
import type { UpdateSongInput } from '../../features/songs/types/song.types'

export const Route = createFileRoute('/songs/$songId')({
  component: SongDetailPage,
})

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

const genreLabels = {
  jazz: 'Jazz',
  blues: 'Blues',
  rock_metal: 'Rock/Metal',
} as const

function SongDetailPage() {
  const { songId } = Route.useParams()
  const navigate = useNavigate()
  const { data: song, isLoading, isError, error } = useSong(songId)
  const updateSong = useUpdateSong()
  const deleteSong = useDeleteSong()
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg bg-muted p-4">
        <p className="text-muted-foreground">Loading song...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link
          to="/songs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to songs
        </Link>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!song) {
    return null
  }

  function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this song?')) {
      return
    }
    deleteSong.mutate(songId, {
      onSuccess: () => {
        void navigate({ to: '/songs' })
      },
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/songs"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to songs
      </Link>

      {isEditing ? (
        <>
          <h2 className="text-2xl font-semibold">Edit Song</h2>
          <SongForm
            defaultValues={{
              title: song.title,
              artist: song.artist,
              notes: song.notes,
            }}
            onSubmit={(data) => {
              updateSong.mutate(
                { id: songId, input: data as UpdateSongInput },
                {
                  onSuccess: () => {
                    setIsEditing(false)
                  },
                },
              )
            }}
            isSubmitting={updateSong.isPending}
            isEdit
          />
          {updateSong.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="font-medium text-destructive">
                Error: {updateSong.error.message}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="border border-border p-6" style={{ borderRadius: 'var(--genre-radius-lg)', boxShadow: 'var(--genre-shadow)' }}>
            <h2 className="text-2xl font-semibold">{song.title}</h2>
            <p className="mt-1 text-lg text-muted-foreground">{song.artist}</p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Genre: {genreLabels[song.genre]}</span>
            </div>

            {song.notes && (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="mb-1 text-sm font-medium text-foreground">Notes</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{song.notes}</p>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              <p>Added: {formatDateTime(song.created_at)}</p>
              <p>Updated: {formatDateTime(song.updated_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSong.isPending}
            >
              {deleteSong.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>

          {deleteSong.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="font-medium text-destructive">
                Error: {deleteSong.error.message}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
