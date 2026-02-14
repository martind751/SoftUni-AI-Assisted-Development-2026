import { Link } from '@tanstack/react-router'
import type { Song } from '../types/song.types'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface SongCardProps {
  song: Song
}

export function SongCard({ song }: SongCardProps) {
  return (
    <Link
      to="/songs/$songId"
      params={{ songId: song.id }}
      className="block border border-border bg-card p-4 transition-all duration-300 hover:bg-muted"
      style={{ borderRadius: 'var(--genre-radius-lg)', boxShadow: 'var(--genre-shadow)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{song.title}</h3>
          <p className="text-sm text-muted-foreground">{song.artist}</p>
          {(song.album || song.duration_seconds || song.release_year) && (
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              {[
                song.album,
                song.release_year,
                song.duration_seconds && formatDuration(song.duration_seconds),
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          {song.notes && (
            <p className="mt-1 truncate text-sm text-muted-foreground/70">{song.notes}</p>
          )}
        </div>
        <time className="shrink-0 text-xs text-muted-foreground">
          {new Date(song.created_at).toLocaleDateString()}
        </time>
      </div>
    </Link>
  )
}
