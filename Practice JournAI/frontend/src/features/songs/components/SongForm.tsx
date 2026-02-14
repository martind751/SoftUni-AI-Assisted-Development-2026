import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/button'
import { useGenre } from '../../../contexts/GenreContext'
import { MusicBrainzSearch } from './MusicBrainzSearch'
import type { MusicBrainzSelection } from './MusicBrainzSearch'
import type { CreateSongInput, UpdateSongInput } from '../types/song.types'
import type { Genre } from '../../sessions/types/session.types'

const genreLabels = {
  jazz: 'Jazz',
  blues: 'Blues',
  rock_metal: 'Rock/Metal',
} as const

const genreOptions: { value: Genre; label: string }[] = [
  { value: 'jazz', label: 'Jazz' },
  { value: 'blues', label: 'Blues' },
  { value: 'rock_metal', label: 'Rock/Metal' },
]

interface SongFormProps {
  defaultValues?: {
    title: string
    artist: string
    notes: string | null
    duration_seconds: number | null
    album: string | null
    release_year: number | null
    musicbrainz_artist_id: string | null
  }
  onSubmit: (data: CreateSongInput | UpdateSongInput) => void
  isSubmitting: boolean
  isEdit?: boolean
}

export function SongForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEdit = false,
}: SongFormProps) {
  const navigate = useNavigate()
  const { activeGenre } = useGenre()

  const isAllGenre = activeGenre === 'all'
  const [selectedGenre, setSelectedGenre] = useState<Genre>(
    isAllGenre ? 'jazz' : activeGenre,
  )
  const genre = isAllGenre ? selectedGenre : activeGenre

  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [artist, setArtist] = useState(defaultValues?.artist ?? '')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [durationSeconds, setDurationSeconds] = useState<number | null>(defaultValues?.duration_seconds ?? null)
  const [album, setAlbum] = useState(defaultValues?.album ?? '')
  const [releaseYear, setReleaseYear] = useState<number | null>(defaultValues?.release_year ?? null)
  const [musicbrainzArtistId, setMusicbrainzArtistId] = useState(defaultValues?.musicbrainz_artist_id ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleMusicBrainzSelect(result: MusicBrainzSelection) {
    setTitle(result.title)
    setArtist(result.artist)
    setDurationSeconds(result.duration_seconds)
    setAlbum(result.album ?? '')
    setReleaseYear(result.release_year)
    setMusicbrainzArtistId(result.musicbrainz_artist_id)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!artist.trim()) newErrors.artist = 'Artist is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    onSubmit({
      title: title.trim(),
      artist: artist.trim(),
      genre,
      notes: notes.trim() || null,
      duration_seconds: durationSeconds,
      album: album.trim() || null,
      release_year: releaseYear,
      musicbrainz_artist_id: musicbrainzArtistId.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAllGenre ? (
        <div>
          <label
            htmlFor="genre"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Genre
          </label>
          <select
            id="genre"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value as Genre)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {genreOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          Genre: <span className="font-medium">{genreLabels[activeGenre]}</span>
        </div>
      )}

      {!isEdit && <MusicBrainzSearch onSelect={handleMusicBrainzSelect} />}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song title"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="artist" className="mb-1 block text-sm font-medium text-foreground">
          Artist
        </label>
        <input
          id="artist"
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist name"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.artist && (
          <p className="mt-1 text-sm text-destructive">{errors.artist}</p>
        )}
      </div>

      <div>
        <label htmlFor="album" className="mb-1 block text-sm font-medium text-foreground">Album</label>
        <input id="album" type="text" value={album} onChange={(e) => setAlbum(e.target.value)}
          placeholder="Album name (optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="releaseYear" className="mb-1 block text-sm font-medium text-foreground">Release Year</label>
          <input id="releaseYear" type="number" value={releaseYear ?? ''} onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value, 10) : null)}
            placeholder="e.g. 1959"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="duration" className="mb-1 block text-sm font-medium text-foreground">Duration (seconds)</label>
          <input id="duration" type="number" value={durationSeconds ?? ''} onChange={(e) => setDurationSeconds(e.target.value ? parseInt(e.target.value, 10) : null)}
            placeholder="e.g. 240"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-foreground">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this song..."
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Song' : 'Add Song'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void navigate({ to: '/songs' })}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
