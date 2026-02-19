import { Link, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTrack, saveLikedSong, removeLikedSong, type TrackDetail } from '../lib/api'
import { formatDuration, formatRelativeDate } from '../lib/format'
import RatingShelfTags from '../components/RatingShelfTags'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import PageShell from '../components/PageShell'

const KEY_NAMES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B']

function keyToString(key: number, mode: number): string {
  if (key < 0 || key > 11) return 'Unknown'
  return `${KEY_NAMES[key]} ${mode === 1 ? 'Major' : 'Minor'}`
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

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn } = useAuth()
  const [track, setTrack] = useState<TrackDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !id) return
    getTrack(id)
      .then((data) => {
        setTrack(data)
        setIsLiked(data.is_liked)
      })
      .catch(() => setError('Failed to load track details.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, id])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  async function toggleLike() {
    if (!track) return
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    try {
      if (wasLiked) await removeLikedSong(track.id)
      else await saveLikedSong(track.id)
    } catch {
      setIsLiked(wasLiked)
    }
  }

  function togglePreview() {
    if (!track?.preview_url) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(track.preview_url)
      audioRef.current.addEventListener('ended', () => setIsPlaying(false))
    }
    audioRef.current.play()
    setIsPlaying(true)
  }

  if (loading) return <LoadingState />

  if (error || !track) return <ErrorState message={error || 'Track not found'} backTo="/history" backLabel="Back to Listening History" />

  const af = track.audio_features
  const stats = track.listening_stats

  return (
    <PageShell narrow>
        {/* Hero section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
          {track.album_cover ? (
            <img src={track.album_cover} alt={track.album_name} className="w-48 h-48 rounded-lg shadow-lg flex-shrink-0" />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-slate-800 flex-shrink-0" />
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold mb-2">{track.name}</h1>
            <p className="text-lg text-slate-300 mb-1">
              {track.artists.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ', '}
                  <Link to={`/artist/${a.id}`} className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                    {a.name}
                  </Link>
                </span>
              ))}
            </p>
            <p className="text-sm text-slate-400 mb-4">
              <Link to={`/album/${track.album_id}`} className="hover:text-indigo-400 hover:underline transition-colors">
                {track.album_name}
              </Link>
              {' '}&middot; {track.release_date}
            </p>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <button
                onClick={toggleLike}
                className={`hover:scale-110 transition-transform ${isLiked ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                aria-label={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
              >
                <HeartIcon filled={isLiked} />
              </button>
              {track.preview_url && (
                <button
                  onClick={togglePreview}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                    isPlaying
                      ? 'bg-white text-black hover:bg-slate-200'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                      </svg>
                      Pause Preview
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                      </svg>
                      Play Preview
                    </>
                  )}
                </button>
              )}
              {track.spotify_url && (
                <a
                  href={track.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  Open in Spotify
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Duration</p>
            <p className="text-lg font-semibold">{formatDuration(track.duration_ms)}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Track</p>
            <p className="text-lg font-semibold">
              {track.track_number} of {track.total_tracks}
              {track.disc_number > 1 && <span className="text-slate-400 text-sm"> (Disc {track.disc_number})</span>}
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Content</p>
            <p className="text-lg font-semibold">
              {track.explicit ? (
                <span className="inline-block px-2 py-0.5 bg-slate-700 text-white text-xs font-bold rounded uppercase">Explicit</span>
              ) : (
                <span className="text-slate-300">Clean</span>
              )}
            </p>
          </div>
        </div>

        {/* Listening Stats */}
        {stats.play_count > 0 && (
          <div className="bg-slate-900 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Your Listening History</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-400">{stats.play_count}</p>
                <p className="text-slate-400 text-sm">{stats.play_count === 1 ? 'play' : 'plays'}</p>
              </div>
              {stats.first_played && (
                <div className="text-center">
                  <p className="text-lg font-semibold">{formatRelativeDate(stats.first_played)}</p>
                  <p className="text-slate-400 text-sm">first played</p>
                </div>
              )}
              {stats.last_played && (
                <div className="text-center">
                  <p className="text-lg font-semibold">{formatRelativeDate(stats.last_played)}</p>
                  <p className="text-slate-400 text-sm">last played</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rating, Shelf, Tags */}
        <RatingShelfTags
          entityType="track"
          entityId={track.id}
          entityName={track.name}
          entityImageUrl={track.album_cover}
          initialRating={track.rating}
          initialShelf={track.shelf}
          initialTags={track.tags}
        />

        {/* Audio Features section */}
        {af ? (
          <div className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Audio Features</h2>

            {/* Bar meters for 0-1 features */}
            <div className="space-y-4 mb-8">
              {([
                ['Danceability', af.danceability],
                ['Energy', af.energy],
                ['Acousticness', af.acousticness],
                ['Instrumentalness', af.instrumentalness],
                ['Liveness', af.liveness],
                ['Speechiness', af.speechiness],
                ['Valence', af.valence],
              ] as [string, number][]).map(([label, value]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{label}</span>
                    <span className="text-slate-400">{Math.round(value * 100)}%</span>
                  </div>
                  <div className="bg-slate-800 rounded-full h-2.5">
                    <div
                      className="bg-indigo-500 rounded-full h-2.5 transition-all"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Value cards for non-0-1 features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Tempo</p>
                <p className="font-semibold">{Math.round(af.tempo)} BPM</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Key</p>
                <p className="font-semibold">{keyToString(af.key, af.mode)}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Loudness</p>
                <p className="font-semibold">{af.loudness.toFixed(1)} dB</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Time Sig</p>
                <p className="font-semibold">{af.time_signature}/4</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">Audio Features</h2>
            <p className="text-slate-400 text-sm">
              Audio features like danceability, energy, tempo, and key are not available for this app.
              This data requires extended Spotify API access.
            </p>
          </div>
        )}
    </PageShell>
  )
}
