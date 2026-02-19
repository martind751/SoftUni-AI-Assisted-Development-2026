import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PillGroup from '../components/PillGroup'
import PageShell from '../components/PageShell'
import { formatMs } from '../lib/format'
import {
  getSpotifyTop,
  getMyTop,
  type SpotifyTopType,
  type MyTopType,
  type SpotifyTopResponse,
  type MyTopResponse,
  type SpotifyTopItem,
  type MyTopItem,
  type TimeRange,
} from '../lib/api'

// --- Constants ---

type RankingsTab = 'spotify' | 'my-listening'

const TAB_OPTIONS: { value: RankingsTab; label: string }[] = [
  { value: 'spotify', label: 'Spotify Top' },
  { value: 'my-listening', label: 'My Listening' },
]

const SPOTIFY_TYPE_OPTIONS = [
  { value: 'tracks' as const, label: 'Tracks' },
  { value: 'artists' as const, label: 'Artists' },
]

const MY_TYPE_OPTIONS = [
  { value: 'tracks' as const, label: 'Tracks' },
  { value: 'artists' as const, label: 'Artists' },
  { value: 'albums' as const, label: 'Albums' },
  { value: 'genres' as const, label: 'Genres' },
]

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'short_term', label: '4 weeks' },
  { value: 'medium_term', label: '6 months' },
  { value: 'long_term', label: 'All time' },
]

// --- Section Components ---

function SpotifyTopSection() {
  const navigate = useNavigate()
  const [type, setType] = useState<SpotifyTopType>('tracks')
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const [data, setData] = useState<SpotifyTopResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getSpotifyTop(type, timeRange)
      .then(setData)
      .catch(() => setError('Failed to load Spotify top data'))
      .finally(() => setLoading(false))
  }, [type, timeRange])

  const items = data?.items ?? []

  const handleRowClick = (item: SpotifyTopItem) => {
    const prefix = type === 'tracks' ? 'track' : 'artist'
    navigate(`/${prefix}/${item.id}`)
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white whitespace-nowrap">Spotify Top</h2>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <PillGroup options={SPOTIFY_TYPE_OPTIONS} value={type} onChange={setType} size="sm" />
        <PillGroup options={TIME_RANGE_OPTIONS} value={timeRange} onChange={setTimeRange} size="sm" />
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : error ? (
        <p className="text-red-400 text-center py-8">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No data for this period</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={`${item.rank}-${item.id}`}
              onClick={() => handleRowClick(item)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-800"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRowClick(item)
                }
              }}
            >
              <span className="text-lg font-bold text-white w-8 text-right flex-shrink-0">
                #{item.rank}
              </span>

              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className={`w-12 h-12 flex-shrink-0 object-cover ${type === 'artists' ? 'rounded-full' : 'rounded'}`}
                />
              ) : (
                <div className={`w-12 h-12 flex-shrink-0 bg-slate-800 ${type === 'artists' ? 'rounded-full' : 'rounded'}`} />
              )}

              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{item.name}</p>
                {item.subtitle && (
                  <p className="text-sm text-slate-400 truncate">{item.subtitle}</p>
                )}
              </div>

              <svg
                className="w-5 h-5 text-slate-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function MyListeningSection() {
  const navigate = useNavigate()
  const [type, setType] = useState<MyTopType>('tracks')
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const [data, setData] = useState<MyTopResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getMyTop(type, timeRange)
      .then(setData)
      .catch(() => setError('Failed to load listening data'))
      .finally(() => setLoading(false))
  }, [type, timeRange])

  const items = data?.items ?? []
  const isGenre = type === 'genres'
  const isArtist = type === 'artists'

  const handleRowClick = (item: MyTopItem) => {
    if (isGenre || !item.id) return
    const prefix = type === 'tracks' ? 'track' : type === 'artists' ? 'artist' : 'album'
    navigate(`/${prefix}/${item.id}`)
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white whitespace-nowrap">Since I Joined SoundScrAIbe</h2>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <PillGroup options={MY_TYPE_OPTIONS} value={type} onChange={setType} size="sm" />
        <PillGroup options={TIME_RANGE_OPTIONS} value={timeRange} onChange={setTimeRange} size="sm" />
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : error ? (
        <p className="text-red-400 text-center py-8">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No data for this period</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const clickable = !isGenre && !!item.id
            return (
              <div
                key={`${item.rank}-${item.name}`}
                onClick={() => handleRowClick(item)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  clickable ? 'cursor-pointer hover:bg-slate-800' : ''
                }`}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && clickable) {
                    e.preventDefault()
                    handleRowClick(item)
                  }
                }}
              >
                <span className="text-lg font-bold text-white w-8 text-right flex-shrink-0">
                  #{item.rank}
                </span>

                {!isGenre && (
                  item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={`w-12 h-12 flex-shrink-0 object-cover ${isArtist ? 'rounded-full' : 'rounded'}`}
                    />
                  ) : (
                    <div className={`w-12 h-12 flex-shrink-0 bg-slate-800 ${isArtist ? 'rounded-full' : 'rounded'}`} />
                  )
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{item.name}</p>
                  {item.subtitle && (
                    <p className="text-sm text-slate-400 truncate">{item.subtitle}</p>
                  )}
                </div>

                <div className="text-right flex-shrink-0 text-sm text-slate-400">
                  {item.play_count} plays
                  <span className="mx-1">&middot;</span>
                  {formatMs(item.total_ms)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// --- Main Page ---

export default function RankingsPage() {
  const { isLoggedIn } = useAuth()
  const [activeTab, setActiveTab] = useState<RankingsTab>('spotify')

  if (!isLoggedIn) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-slate-400">Loading...</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Rankings">
        <div className="mb-6">
          <PillGroup options={TAB_OPTIONS} value={activeTab} onChange={setActiveTab} size="lg" />
        </div>

        {activeTab === 'spotify' && <SpotifyTopSection />}
        {activeTab === 'my-listening' && <MyListeningSection />}
    </PageShell>
  )
}
