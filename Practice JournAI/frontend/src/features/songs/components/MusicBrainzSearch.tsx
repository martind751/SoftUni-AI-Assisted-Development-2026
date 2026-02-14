import { useState, useEffect } from 'react'
import { useMusicBrainzArtistSearch, useMusicBrainzRecordings } from '../hooks/useSongs'
import type { MusicBrainzArtistResult } from '../types/song.types'

export interface MusicBrainzSelection {
  title: string
  artist: string
  duration_seconds: number | null
  album: string | null
  release_year: number | null
  musicbrainz_artist_id: string
}

interface MusicBrainzSearchProps {
  onSelect: (result: MusicBrainzSelection) => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MusicBrainzSearch({ onSelect }: MusicBrainzSearchProps) {
  const [artistQuery, setArtistQuery] = useState('')
  const [debouncedArtistQuery, setDebouncedArtistQuery] = useState('')
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<MusicBrainzArtistResult | null>(null)
  const [songQuery, setSongQuery] = useState('')
  const [debouncedSongQuery, setDebouncedSongQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedArtistQuery(artistQuery), 500)
    return () => clearTimeout(timer)
  }, [artistQuery])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSongQuery(songQuery), 500)
    return () => clearTimeout(timer)
  }, [songQuery])

  const { data: artistResults, isLoading: isLoadingArtists } =
    useMusicBrainzArtistSearch(debouncedArtistQuery)

  const { data: recordings, isLoading: isLoadingRecordings } =
    useMusicBrainzRecordings(selectedArtist?.id ?? '', debouncedSongQuery)

  useEffect(() => {
    if (debouncedArtistQuery.length >= 2) {
      setIsArtistDropdownOpen(true)
    }
  }, [debouncedArtistQuery])

  function handleArtistSelect(artist: MusicBrainzArtistResult) {
    setSelectedArtist(artist)
    setArtistQuery('')
    setDebouncedArtistQuery('')
    setIsArtistDropdownOpen(false)
  }

  function handleChangeArtist() {
    setSelectedArtist(null)
    setSongQuery('')
    setDebouncedSongQuery('')
  }

  function handleRecordingSelect(recording: { title: string; artist: string; duration_seconds: number | null; album: string | null; release_year: number | null }) {
    onSelect({
      title: recording.title,
      artist: selectedArtist!.name,
      duration_seconds: recording.duration_seconds,
      album: recording.album,
      release_year: recording.release_year,
      musicbrainz_artist_id: selectedArtist!.id,
    })
    setSelectedArtist(null)
    setSongQuery('')
    setDebouncedSongQuery('')
  }

  // Step 2: Artist selected — show recordings
  if (selectedArtist) {
    return (
      <div className="space-y-2">
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
          Search MusicBrainz
          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Beta
          </span>
        </label>

        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-sm">
            <span className="font-medium text-foreground">{selectedArtist.name}</span>
            {selectedArtist.country && (
              <span className="text-muted-foreground"> ({selectedArtist.country})</span>
            )}
          </span>
          <button
            type="button"
            onClick={handleChangeArtist}
            className="text-xs text-primary hover:underline"
          >
            Change
          </button>
        </div>

        <input
          type="text"
          value={songQuery}
          onChange={(e) => setSongQuery(e.target.value)}
          placeholder="Search for a song title..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {isLoadingRecordings && (
          <p className="text-sm text-muted-foreground">Loading recordings...</p>
        )}

        {recordings && recordings.length > 0 && (
          <ul className="max-h-60 overflow-y-auto rounded-md border border-border bg-card">
            {recordings.map((rec, i) => (
              <li key={`${rec.title}-${i}`}>
                <button
                  type="button"
                  onClick={() => handleRecordingSelect(rec)}
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <div className="font-medium text-foreground">{rec.title}</div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {rec.album && <span>{rec.album}</span>}
                    {rec.release_year && <span>{rec.release_year}</span>}
                    {rec.duration_seconds && <span>{formatDuration(rec.duration_seconds)}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {recordings && recordings.length === 0 && !isLoadingRecordings && (
          <p className="text-sm text-muted-foreground">No recordings found for this artist.</p>
        )}
      </div>
    )
  }

  // Step 1: Artist search
  return (
    <div className="relative space-y-1">
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
        Search MusicBrainz
        <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          Beta
        </span>
      </label>
      <input
        type="text"
        value={artistQuery}
        onChange={(e) => setArtistQuery(e.target.value)}
        onFocus={() => { if (artistResults && artistResults.length > 0) setIsArtistDropdownOpen(true) }}
        placeholder="Search for an artist..."
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {isLoadingArtists && debouncedArtistQuery.length >= 2 && (
        <p className="text-sm text-muted-foreground">Searching artists...</p>
      )}
      {isArtistDropdownOpen && artistResults && artistResults.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {artistResults.map((artist, i) => (
            <li key={`${artist.id}-${i}`}>
              <button
                type="button"
                onClick={() => handleArtistSelect(artist)}
                className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium text-foreground">{artist.name}</span>
                {artist.country && (
                  <span className="text-muted-foreground"> ({artist.country})</span>
                )}
                {artist.disambiguation && (
                  <span className="block text-xs text-muted-foreground/70">{artist.disambiguation}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {isArtistDropdownOpen && artistResults && artistResults.length === 0 && debouncedArtistQuery.length >= 2 && !isLoadingArtists && (
        <p className="text-sm text-muted-foreground">No artists found.</p>
      )}
    </div>
  )
}
