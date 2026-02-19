import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getLibrarySummary, type LibrarySummary } from '../lib/api'
import PillGroup from '../components/PillGroup'
import PageShell from '../components/PageShell'

const GROUPS = [
  { key: 'rated', label: 'Rated', countKey: 'rated' as keyof LibrarySummary },
  { key: 'on-rotation', label: 'On Rotation', countKey: 'on_rotation' as keyof LibrarySummary },
  { key: 'want-to-listen', label: 'Want to Listen', countKey: 'want_to_listen' as keyof LibrarySummary },
  { key: 'favorites', label: 'Favorites', countKey: 'favorites' as keyof LibrarySummary },
]

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'track', label: 'Tracks' },
  { value: 'album', label: 'Albums' },
  { value: 'artist', label: 'Artists' },
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
    <PageShell title="My Library">
        {/* Entity type filter tabs */}
        <div className="mb-6">
          <PillGroup options={ENTITY_TYPE_OPTIONS} value={entityType} onChange={setEntityType} size="md" />
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
    </PageShell>
  )
}
