import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getLibrary, type LibraryItem, type LibraryResponse } from '../lib/api'

const ENTITY_TYPES = [
  { key: '', label: 'All' },
  { key: 'track', label: 'Tracks' },
  { key: 'album', label: 'Albums' },
  { key: 'artist', label: 'Artists' },
]

const SHELF_OPTIONS = [
  { key: '', label: 'All Shelves' },
  { key: 'listened', label: 'Listened' },
  { key: 'currently_listening', label: 'Currently Listening' },
  { key: 'want_to_listen', label: 'Want to Listen' },
]

const SORT_OPTIONS = [
  { key: 'rating_desc', label: 'Rating (High to Low)' },
  { key: 'name_asc', label: 'Name (A-Z)' },
  { key: 'recent', label: 'Recent' },
]

function shelfIcon(shelf: string | null): React.ReactNode {
  if (shelf === 'listened') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-400">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    )
  }
  if (shelf === 'currently_listening') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-400">
        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm11 5.5a.75.75 0 00-1.5 0A6.5 6.5 0 013.5 9.5a.75.75 0 00-1.5 0 8 8 0 005.25 7.524V19H5.5a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-1.75v-1.976A8 8 0 0018 9.5z" />
      </svg>
    )
  }
  if (shelf === 'want_to_listen') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-400">
        <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
      </svg>
    )
  }
  return null
}

function entityLink(item: LibraryItem): string {
  if (item.entity_type === 'track') return `/track/${item.entity_id}`
  if (item.entity_type === 'album') return `/album/${item.entity_id}`
  if (item.entity_type === 'artist') return `/artist/${item.entity_id}`
  return '#'
}

const PAGE_LIMIT = 20

export default function LibraryPage() {
  const { isLoggedIn } = useAuth()
  const [data, setData] = useState<LibraryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entityType, setEntityType] = useState('')
  const [shelf, setShelf] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    getLibrary({
      entity_type: entityType || undefined,
      shelf: shelf || undefined,
      sort: sort || undefined,
      page,
      limit: PAGE_LIMIT,
    })
      .then((res) => setData(res))
      .catch(() => setError('Failed to load library.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, entityType, shelf, sort, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [entityType, shelf, sort])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_LIMIT)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Entity type tabs */}
          <div className="flex gap-1.5">
            {ENTITY_TYPES.map((et) => (
              <button
                key={et.key}
                type="button"
                onClick={() => setEntityType(et.key)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  entityType === et.key
                    ? 'bg-green-500 text-black font-semibold'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>

          {/* Shelf dropdown */}
          <select
            value={shelf}
            onChange={(e) => setShelf(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-green-500"
          >
            {SHELF_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-green-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No items in your library yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Rate, shelve, or tag music from detail pages to build your collection.
            </p>
          </div>
        )}

        {/* Grid of cards */}
        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <Link
                  key={`${item.entity_type}-${item.entity_id}`}
                  to={entityLink(item)}
                  className="group bg-gray-900 rounded-lg overflow-hidden hover:brightness-110 transition-all"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={`w-full aspect-square object-cover ${
                        item.entity_type === 'artist' ? 'rounded-full p-3' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-800" />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate group-hover:text-green-400 transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-500 uppercase">{item.entity_type}</span>
                      {item.rating !== null && (
                        <span className="text-xs font-bold text-green-400">{item.rating}/10</span>
                      )}
                      {shelfIcon(item.shelf)}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{item.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
