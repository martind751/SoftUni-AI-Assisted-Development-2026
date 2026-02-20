import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import RecommendCard from '../components/RecommendCard'
import { getRecommendationHistory, type RecommendationHistoryItem } from '../lib/api'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

function HistoryCard({ item }: { item: RecommendationHistoryItem }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Summary row (clickable) */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-sm">{formatDate(item.created_at)}</span>
            <span
              className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                item.mode === 'smart'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {item.mode === 'smart' ? 'Smart' : 'Prompt'}
            </span>
          </div>
          <span className="text-slate-500 text-sm whitespace-nowrap">
            {item.recommendations.length} rec{item.recommendations.length !== 1 ? 's' : ''}
          </span>
        </div>

        {item.user_prompt && (
          <p className="text-white text-sm font-medium mb-1">"{item.user_prompt}"</p>
        )}

        <p className="text-slate-400 text-sm">{truncate(item.taste_summary, 100)}</p>

        {/* Expand indicator */}
        <div className="mt-2 text-indigo-400 text-xs">
          {expanded ? 'Hide recommendations' : 'Show recommendations'}
        </div>
      </button>

      {/* Expanded recommendations */}
      {expanded && (
        <div className="border-t border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.recommendations.map((rec) => (
              <RecommendCard key={`${rec.type}-${rec.spotify_id}`} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DiscoverHistoryPage() {
  const [history, setHistory] = useState<RecommendationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getRecommendationHistory()
      .then(setHistory)
      .catch(() => setError('Failed to load recommendation history'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/discover"
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
          aria-label="Back to Discover"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-3xl font-bold">Recommendation History</h1>
      </div>

      {loading && <p className="text-slate-400 text-center py-8">Loading...</p>}

      {!loading && error && <p className="text-red-400 text-center py-8">{error}</p>}

      {!loading && !error && history.length === 0 && (
        <div className="bg-slate-900 rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-4">No past recommendations yet.</p>
          <Link
            to="/discover"
            className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
          >
            Get your first recommendations
          </Link>
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="space-y-4">
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
