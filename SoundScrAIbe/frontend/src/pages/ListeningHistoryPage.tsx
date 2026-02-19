import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRecentlyPlayed, checkLikedSongs, saveLikedSong, removeLikedSong, type RecentTrack } from '../lib/api'
import { formatDuration } from '../lib/format'
import PageShell from '../components/PageShell'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function groupByDay(tracks: RecentTrack[]): [string, RecentTrack[]][] {
  const groups = new Map<string, RecentTrack[]>()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const track of tracks) {
    const playedDate = new Date(track.played_at)
    let label: string

    if (isSameDay(playedDate, today)) {
      label = 'Today'
    } else if (isSameDay(playedDate, yesterday)) {
      label = 'Yesterday'
    } else {
      label = playedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    }

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(track)
  }

  return Array.from(groups.entries())
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 8.25c0-3.105-2.464-5.25-5.437-5.25a5.5 5.5 0 00-4.313 2.052A5.5 5.5 0 007.688 3C4.714 3 2.25 5.145 2.25 8.25c0 3.925 2.438 7.111 4.739 9.256a25.175 25.175 0 004.244 3.17c.138.08.283.144.383.219l.022.012.007.004.003.001a.752.752 0 00.704 0l.003-.001.007-.004.022-.012a15.247 15.247 0 00.383-.219 25.175 25.175 0 004.244-3.17C19.312 15.36 21.75 12.174 21.75 8.25z" />
    </svg>
  )
}

export default function ListeningHistoryPage() {
  const { isLoggedIn } = useAuth()
  const [tracks, setTracks] = useState<RecentTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isLoggedIn) return

    getRecentlyPlayed()
      .then((items) => {
        setTracks(items)
        const uniqueIds = [...new Set(items.map((t) => t.id))]
        if (uniqueIds.length > 0) {
          checkLikedSongs(uniqueIds)
            .then(setLikedMap)
            .catch(() => {})
        }
      })
      .catch(() => setError('Failed to load listening history. You may need to log out and back in.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  async function toggleLike(trackId: string) {
    const isCurrentlyLiked = likedMap[trackId] ?? false
    setLikedMap((prev) => ({ ...prev, [trackId]: !isCurrentlyLiked }))

    try {
      if (isCurrentlyLiked) {
        await removeLikedSong(trackId)
      } else {
        await saveLikedSong(trackId)
      }
    } catch {
      setLikedMap((prev) => ({ ...prev, [trackId]: isCurrentlyLiked }))
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const grouped = groupByDay(tracks)

  const uniqueTrackIds = [...new Set(tracks.map((t) => t.id))]
  const likedCount = uniqueTrackIds.filter((id) => likedMap[id]).length
  const likedPercentage = uniqueTrackIds.length > 0
    ? Math.round((likedCount / uniqueTrackIds.length) * 100)
    : 0

  return (
    <PageShell title="Listening History">
        {tracks.length > 0 && Object.keys(likedMap).length > 0 && (
          <p className="text-slate-400 text-sm mb-6">
            <span className="text-indigo-400 font-medium">{likedCount}</span> of{' '}
            <span className="font-medium text-white">{uniqueTrackIds.length}</span> unique tracks liked ({likedPercentage}%)
          </p>
        )}

        {tracks.length === 0 ? (
          <p className="text-slate-400">No recently played tracks.</p>
        ) : (
          grouped.map(([dayLabel, dayTracks]) => (
            <div key={dayLabel} className="mb-8">
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wide mb-3">
                {dayLabel}
              </h2>
              <div className="space-y-2">
                {dayTracks.map((track, i) => (
                  <Link
                    to={`/track/${track.id}`}
                    key={`${track.played_at}-${i}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    {track.album_cover ? (
                      <img
                        src={track.album_cover}
                        alt={track.album}
                        className="w-12 h-12 rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-slate-800 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-slate-400 text-sm truncate">
                        {track.artists.join(', ')} &middot; {track.album}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleLike(track.id)
                      }}
                      className={`flex-shrink-0 hover:scale-110 transition-transform ${
                        likedMap[track.id] ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      aria-label={likedMap[track.id] ? 'Remove from liked songs' : 'Add to liked songs'}
                    >
                      <HeartIcon filled={likedMap[track.id] ?? false} />
                    </button>
                    <div className="text-right flex-shrink-0">
                      <p className="text-slate-400 text-sm">{formatDuration(track.duration_ms)}</p>
                      <p className="text-slate-500 text-xs">{formatTime(track.played_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
    </PageShell>
  )
}
