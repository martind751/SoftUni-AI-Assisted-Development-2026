import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAlbum, type AlbumDetail } from '../lib/api'
import RatingShelfTags from '../components/RatingShelfTags'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import PageShell from '../components/PageShell'

function formatAlbumType(type: string): string {
  if (type === 'single') return 'Single'
  if (type === 'compilation') return 'Compilation'
  return 'Album'
}

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn } = useAuth()
  const [album, setAlbum] = useState<AlbumDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn || !id) return
    getAlbum(id)
      .then((data) => setAlbum(data))
      .catch(() => setError('Failed to load album details.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, id])

  if (loading) return <LoadingState />

  if (error || !album) return <ErrorState message={error || 'Album not found'} backTo="/library" backLabel="Back to Library" />

  const coverImage = album.images.length > 0 ? album.images[0].url : ''

  return (
    <PageShell narrow>
        {/* Hero section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
          {coverImage ? (
            <img src={coverImage} alt={album.name} className="w-48 h-48 rounded-lg shadow-lg flex-shrink-0" />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-slate-800 flex-shrink-0" />
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold mb-2">{album.name}</h1>
            <p className="text-lg text-slate-300 mb-1">
              {album.artists.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ', '}
                  <Link to={`/artist/${a.id}`} className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                    {a.name}
                  </Link>
                </span>
              ))}
            </p>
            <p className="text-sm text-slate-400 mb-2">
              {album.release_date} &middot; {album.label}
            </p>
            <span className="inline-block px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full uppercase">
              {formatAlbumType(album.album_type)}
            </span>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total Tracks</p>
            <p className="text-lg font-semibold">{album.total_tracks}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Popularity</p>
            <p className="text-lg font-semibold">{album.popularity}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Genres</p>
            <p className="text-sm font-semibold">
              {album.genres.length > 0 ? album.genres.join(', ') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Rating, Shelf, Tags */}
        <RatingShelfTags
          entityType="album"
          entityId={album.id}
          entityName={album.name}
          entityImageUrl={coverImage}
          initialRating={album.rating}
          initialShelf={album.shelf}
          initialTags={album.tags}
        />

        {/* Open in Spotify */}
        {album.spotify_url && (
          <div className="text-center">
            <a
              href={album.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-full transition-colors"
            >
              Open in Spotify
            </a>
          </div>
        )}
    </PageShell>
  )
}
