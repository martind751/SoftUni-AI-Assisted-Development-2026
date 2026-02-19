import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRecentlyPlayed, checkLikedSongs, saveLikedSong, removeLikedSong, type RecentTrack } from '../lib/api'

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

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
  const { loading: authLoading, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [tracks, setTracks] = useState<RecentTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/')
    }
  }, [authLoading, isLoggedIn, navigate])

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/profile" className="text-green-400 hover:text-green-300 hover:underline">
            Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  const grouped = groupByDay(tracks)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to="/profile"
          className="text-green-400 hover:text-green-300 hover:underline transition-colors text-sm"
        >
          &larr; Profile
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-8">Listening History</h1>

        {tracks.length === 0 ? (
          <p className="text-gray-400">No recently played tracks.</p>
        ) : (
          grouped.map(([dayLabel, dayTracks]) => (
            <div key={dayLabel} className="mb-8">
              <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-3">
                {dayLabel}
              </h2>
              <div className="space-y-2">
                {dayTracks.map((track, i) => (
                  <div
                    key={`${track.played_at}-${i}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    {track.album_cover ? (
                      <img
                        src={track.album_cover}
                        alt={track.album}
                        className="w-12 h-12 rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-800 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-gray-400 text-sm truncate">
                        {track.artists.join(', ')} &middot; {track.album}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleLike(track.id)}
                      className={`flex-shrink-0 hover:scale-110 transition-transform ${
                        likedMap[track.id] ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
                      }`}
                      aria-label={likedMap[track.id] ? 'Remove from liked songs' : 'Add to liked songs'}
                    >
                      <HeartIcon filled={likedMap[track.id] ?? false} />
                    </button>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-400 text-sm">{formatDuration(track.duration_ms)}</p>
                      <p className="text-gray-500 text-xs">{formatTime(track.played_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
