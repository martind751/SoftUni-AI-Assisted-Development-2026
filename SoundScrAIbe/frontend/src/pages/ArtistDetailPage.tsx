import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getArtist, type ArtistDetail } from '../lib/api'
import RatingShelfTags from '../components/RatingShelfTags'

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn } = useAuth()
  const [artist, setArtist] = useState<ArtistDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn || !id) return
    getArtist(id)
      .then((data) => setArtist(data))
      .catch(() => setError('Failed to load artist details.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Artist not found'}</p>
          <Link to="/library" className="text-indigo-400 hover:text-indigo-300 hover:underline">
            Back to Library
          </Link>
        </div>
      </div>
    )
  }

  const artistImage = artist.images.length > 0 ? artist.images[0].url : ''
  const stats = artist.listening_stats

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
          {artistImage ? (
            <img src={artistImage} alt={artist.name} className="w-48 h-48 rounded-full shadow-lg flex-shrink-0 object-cover" />
          ) : (
            <div className="w-48 h-48 rounded-full bg-slate-800 flex-shrink-0" />
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold mb-2">{artist.name}</h1>
            {artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 justify-center sm:justify-start">
                {artist.genres.map((genre) => (
                  <span key={genre} className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-slate-400 mb-1">
              {artist.followers.toLocaleString()} followers &middot; Popularity {artist.popularity}
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
          entityType="artist"
          entityId={artist.id}
          entityName={artist.name}
          entityImageUrl={artistImage}
          initialRating={artist.rating}
          initialShelf={artist.shelf}
          initialTags={artist.tags}
        />

        {/* Open in Spotify */}
        {artist.spotify_url && (
          <div className="text-center">
            <a
              href={artist.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-full transition-colors"
            >
              Open in Spotify
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
