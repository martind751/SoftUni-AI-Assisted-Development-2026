import { useState, useEffect } from 'react'
import { useMusicBrainzSearch } from '../hooks/useSongs'
import type { MusicBrainzResult } from '../types/song.types'

interface MusicBrainzSearchProps {
  onSelect: (result: MusicBrainzResult) => void
}

export function MusicBrainzSearch({ onSelect }: MusicBrainzSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: results, isLoading } = useMusicBrainzSearch(debouncedQuery)

  // Show dropdown when we have results or are loading
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsOpen(true)
    }
  }, [debouncedQuery])

  function handleSelect(result: MusicBrainzResult) {
    onSelect(result)
    setSearchQuery('')
    setDebouncedQuery('')
    setIsOpen(false)
  }

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
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => { if (results && results.length > 0) setIsOpen(true) }}
        placeholder="Search for a song..."
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {isLoading && debouncedQuery.length >= 2 && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}
      {isOpen && results && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {results.map((result, i) => (
            <li key={`${result.title}-${result.artist}-${i}`}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium text-foreground">{result.title}</span>
                <span className="text-muted-foreground"> by {result.artist}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {isOpen && results && results.length === 0 && debouncedQuery.length >= 2 && !isLoading && (
        <p className="text-sm text-muted-foreground">No results found.</p>
      )}
    </div>
  )
}
