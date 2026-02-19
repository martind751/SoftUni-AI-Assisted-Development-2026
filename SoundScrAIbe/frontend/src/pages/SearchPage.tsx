import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { search, type SearchResult, type SearchTrack, type SearchAlbum, type SearchArtist } from '../lib/api'
import { formatDuration, formatCompactNumber } from '../lib/format'
import PageShell from '../components/PageShell'
import PillGroup from '../components/PillGroup'

function SearchIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-6 h-6 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function TrackRow({ track }: { track: SearchTrack }) {
  return (
    <Link
      to={`/track/${track.id}`}
      className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 rounded-lg p-3 transition-colors"
    >
      {track.album_cover ? (
        <img src={track.album_cover} alt={track.album} className="w-10 h-10 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-slate-800 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{track.name}</p>
        <p className="text-slate-400 text-xs truncate">{track.artists.join(', ')}</p>
      </div>
      <span className="text-slate-500 text-xs flex-shrink-0">{formatDuration(track.duration_ms)}</span>
    </Link>
  )
}

function AlbumCard({ album }: { album: SearchAlbum }) {
  const year = album.release_date ? album.release_date.slice(0, 4) : ''
  return (
    <Link
      to={`/album/${album.id}`}
      className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 rounded-lg p-3 transition-colors"
    >
      {album.image_url ? (
        <img src={album.image_url} alt={album.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded bg-slate-800 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{album.name}</p>
        <p className="text-slate-400 text-xs truncate">{album.artists.join(', ')}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {album.album_type && (
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full capitalize">
            {album.album_type}
          </span>
        )}
        {year && <span className="text-slate-500 text-xs">{year}</span>}
      </div>
    </Link>
  )
}

function ArtistCard({ artist }: { artist: SearchArtist }) {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 rounded-lg p-3 transition-colors"
    >
      {artist.image_url ? (
        <img src={artist.image_url} alt={artist.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{artist.name}</p>
        <p className="text-slate-400 text-xs truncate">
          {artist.genres.length > 0 ? artist.genres.slice(0, 3).join(', ') : 'Artist'}
        </p>
      </div>
      <span className="text-slate-500 text-xs flex-shrink-0">{formatCompactNumber(artist.followers)} followers</span>
    </Link>
  )
}

type SectionKey = 'tracks' | 'albums' | 'artists'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('tracks')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const data = await search(q.trim())
      setResults(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, performSearch])

  const hasResults = results && (results.tracks.length > 0 || results.albums.length > 0 || results.artists.length > 0)
  const noResults = searched && !loading && !hasResults && !error

  const sections: { key: SectionKey; label: string; count: number }[] = [
    { key: 'tracks', label: 'Tracks', count: results?.tracks.length ?? 0 },
    { key: 'albums', label: 'Albums', count: results?.albums.length ?? 0 },
    { key: 'artists', label: 'Artists', count: results?.artists.length ?? 0 },
  ]

  return (
    <PageShell>
        {/* Search input */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for tracks, albums, or artists..."
              className="bg-slate-900 border border-slate-700 rounded-xl text-white text-lg px-12 py-3 w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Empty state */}
        {!searched && !loading && (
          <p className="text-center text-slate-400 mt-16">Search for tracks, albums, or artists</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center mt-16">
            <SpinnerIcon />
          </div>
        )}

        {/* Error */}
        {error && <p className="text-center text-red-400 mt-16">{error}</p>}

        {/* No results */}
        {noResults && (
          <p className="text-center text-slate-400 mt-16">No results found for &ldquo;{query}&rdquo;</p>
        )}

        {/* Results */}
        {hasResults && !loading && (
          <>
            {/* Section tabs */}
            <div className="mb-6">
              <PillGroup
                options={sections.map((s) => ({ value: s.key, label: `${s.label} (${s.count})` }))}
                value={activeSection}
                onChange={setActiveSection}
                size="md"
              />
            </div>

            {/* Active section content */}
            <div className="flex flex-col gap-2">
              {activeSection === 'tracks' && results!.tracks.map((track) => (
                <TrackRow key={track.id} track={track} />
              ))}
              {activeSection === 'albums' && results!.albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
              {activeSection === 'artists' && results!.artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
              {activeSection === 'tracks' && results!.tracks.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No tracks found</p>
              )}
              {activeSection === 'albums' && results!.albums.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No albums found</p>
              )}
              {activeSection === 'artists' && results!.artists.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No artists found</p>
              )}
            </div>
          </>
        )}
    </PageShell>
  )
}
