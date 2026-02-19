import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getLibrarySummary, type LibrarySummary } from '../lib/api'

const GROUPS = [
  { key: 'rated', label: 'Rated', countKey: 'rated' as keyof LibrarySummary },
  { key: 'on-rotation', label: 'On Rotation', countKey: 'on_rotation' as keyof LibrarySummary },
  { key: 'want-to-listen', label: 'Want to Listen', countKey: 'want_to_listen' as keyof LibrarySummary },
  { key: 'favorites', label: 'Favorites', countKey: 'favorites' as keyof LibrarySummary },
]

const ENTITY_TYPES = [
  { key: '', label: 'All' },
  { key: 'track', label: 'Tracks' },
  { key: 'album', label: 'Albums' },
  { key: 'artist', label: 'Artists' },
]

function CoverGrid({ covers }: { covers: string[] }) {
  // Show a 2x2 grid of cover images, with gray placeholders for missing ones
  const slots = [covers[0], covers[1], covers[2], covers[3]]
  return (
    <div className="grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden">
      {slots.map((url, i) =>
        url ? (
          <img key={i} src={url} alt="" className="w-full aspect-square object-cover" />
        ) : (
          <div key={i} className="w-full aspect-square bg-slate-800" />
        )
      )}
    </div>
  )
}

export default function LibraryLandingPage() {
  const { isLoggedIn } = useAuth()
  const [summary, setSummary] = useState<LibrarySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entityType, setEntityType] = useState('')

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    setError('')
    getLibrarySummary(entityType || undefined)
      .then((data) => setSummary(data))
      .catch(() => setError('Failed to load library summary.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, entityType])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>

        {/* Entity type filter tabs */}
        <div className="flex gap-1.5 mb-6">
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

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading...</p>
          </div>
        )}

        {!loading && !error && summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {GROUPS.map((group) => {
              const groupData = summary[group.countKey]
              // Build the link with entity_type query param if set
              const to = entityType
                ? `/library/${group.key}?type=${entityType}`
                : `/library/${group.key}`
              return (
                <Link
                  key={group.key}
                  to={to}
                  className="bg-slate-900 rounded-xl overflow-hidden hover:bg-slate-800 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <CoverGrid covers={groupData.covers} />
                  <div className="p-4">
                    <span className="text-base font-semibold">{group.label}</span>
                    <p className="text-sm text-slate-400 mt-1">
                      {groupData.count} {groupData.count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
