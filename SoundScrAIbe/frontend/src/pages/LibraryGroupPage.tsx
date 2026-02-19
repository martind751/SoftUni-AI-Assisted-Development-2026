import { Link, useParams, Navigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getLibrary, getFavorites, type LibraryItem, type LibraryResponse } from '../lib/api'

const VALID_GROUPS = ['rated', 'on-rotation', 'want-to-listen', 'favorites'] as const

const GROUP_TITLES: Record<string, string> = {
  'rated': 'Rated',
  'on-rotation': 'On Rotation',
  'want-to-listen': 'Want to Listen',
  'favorites': 'Favorites',
}

const ENTITY_TYPES = [
  { key: '', label: 'All' },
  { key: 'track', label: 'Tracks' },
  { key: 'album', label: 'Albums' },
  { key: 'artist', label: 'Artists' },
]

const SORT_OPTIONS = [
  { key: 'rating_desc', label: 'Rating (High to Low)' },
  { key: 'name_asc', label: 'Name (A-Z)' },
  { key: 'recent', label: 'Recent' },
]

const PAGE_LIMIT = 20

function shelfIcon(shelf: string | null): React.ReactNode {
  if (shelf === 'on_rotation') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-orange-400">
        <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM14 12a4 4 0 01-5.168 3.821 3.005 3.005 0 01-.498-1.312c-.07-.46.296-.78.724-.84a1.5 1.5 0 10-.636-2.882c-.378.166-.805-.024-.907-.41A5.992 5.992 0 0110 8a6.003 6.003 0 014 4z" clipRule="evenodd" />
      </svg>
    )
  }
  if (shelf === 'want_to_listen') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-indigo-400">
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

export default function LibraryGroupPage() {
  const { group } = useParams<{ group: string }>()
  const { isLoggedIn } = useAuth()
  const [data, setData] = useState<LibraryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const [entityType, setEntityType] = useState(searchParams.get('type') || '')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)

  const isFavorites = group === 'favorites'
  const isValidGroup = VALID_GROUPS.includes(group as typeof VALID_GROUPS[number])

  useEffect(() => {
    if (!isLoggedIn || !isValidGroup) return
    setLoading(true)
    setError('')

    let request: Promise<LibraryResponse>

    if (group === 'favorites') {
      request = getFavorites({ entity_type: entityType || undefined, page, limit: PAGE_LIMIT })
    } else if (group === 'rated') {
      request = getLibrary({
        rated: 'true',
        entity_type: entityType || undefined,
        sort: sort || undefined,
        page,
        limit: PAGE_LIMIT,
      })
    } else if (group === 'on-rotation') {
      request = getLibrary({
        shelf: 'on_rotation',
        entity_type: entityType || undefined,
        sort: sort || undefined,
        page,
        limit: PAGE_LIMIT,
      })
    } else {
      // want-to-listen
      request = getLibrary({
        shelf: 'want_to_listen',
        entity_type: entityType || undefined,
        sort: sort || undefined,
        page,
        limit: PAGE_LIMIT,
      })
    }

    request
      .then((res) => setData(res))
      .catch(() => setError('Failed to load library.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, isValidGroup, group, entityType, sort, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [entityType, sort, group])

  if (!isValidGroup) {
    return <Navigate to="/library" replace />
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_LIMIT)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/library"
          className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors text-sm mb-4 inline-block"
        >
          &larr; My Library
        </Link>
        <h1 className="text-3xl font-bold mb-6">{GROUP_TITLES[group!]}</h1>

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
                    ? 'bg-indigo-500 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown - hidden for favorites */}
          {!isFavorites && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
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
            <p className="text-slate-400">Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No items in this group yet.</p>
            <p className="text-slate-500 text-sm mt-2">
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
                  className="group bg-slate-900 rounded-lg overflow-hidden hover:brightness-110 transition-all"
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
                    <div className="w-full aspect-square bg-slate-800" />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-slate-500 uppercase">{item.entity_type}</span>
                      {item.rating !== null && (
                        <span className="text-xs font-bold text-indigo-400">{item.rating}/10</span>
                      )}
                      {shelfIcon(item.shelf)}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-slate-500">+{item.tags.length - 3}</span>
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
                  className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
