import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getArtistCharts, type ArtistChartItem, type ArtistChartsData, type TimeRange } from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatListeningTime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const item: ArtistChartItem = payload[0].payload
  const dataKey: string = payload[0].dataKey

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
      <p className="text-white font-medium">{item.artist_name}</p>
      <p className="text-green-400 text-sm">
        {dataKey === 'play_count'
          ? `${item.play_count} plays`
          : formatListeningTime(item.listening_time_ms)}
      </p>
      {item.spotify_rank > 0 && (
        <p className="text-gray-400 text-xs mt-1">Spotify Rank: #{item.spotify_rank}</p>
      )}
    </div>
  )
}

const TIME_RANGE_LABELS: { value: TimeRange; label: string }[] = [
  { value: 'short_term', label: 'Last 4 Weeks' },
  { value: 'medium_term', label: 'Last 6 Months' },
  { value: 'long_term', label: 'All Time' },
]

type ViewMode = 'plays' | 'time'

export default function ArtistChartsPage() {
  const { isLoggedIn } = useAuth()
  const [data, setData] = useState<ArtistChartsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const [viewMode, setViewMode] = useState<ViewMode>('plays')

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    setError('')
    getArtistCharts(timeRange)
      .then(setData)
      .catch(() => setError('Failed to load artist charts. You may need to log out and back in.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, timeRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading charts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  const artists = data?.artists ?? []
  const chartData = artists.slice(0, 15).map((a) => ({
    ...a,
    short_name: a.artist_name.length > 18 ? a.artist_name.slice(0, 17) + '...' : a.artist_name,
  }))
  const chartHeight = Math.max(300, chartData.length * 40)
  const dataKey = viewMode === 'plays' ? 'play_count' : 'listening_time_ms'
  const statLabel = viewMode === 'plays' ? 'Play Count' : 'Listening Time'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Artist Charts</h1>

        {/* Time range tabs */}
        <div className="flex gap-2 mb-4">
          {TIME_RANGE_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                timeRange === value
                  ? 'bg-green-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('plays')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'plays'
                ? 'text-white border border-green-500'
                : 'text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            Play Count
          </button>
          <button
            onClick={() => setViewMode('time')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'time'
                ? 'text-white border border-green-500'
                : 'text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            Listening Time
          </button>
        </div>

        {artists.length === 0 ? (
          <p className="text-gray-400">
            No listening data yet. Play some music on Spotify and come back!
          </p>
        ) : (
          <>
            {/* Chart section */}
            <div className="bg-gray-900 rounded-xl p-4 mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Top Artists by {statLabel}
              </h2>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <YAxis
                    dataKey="short_name"
                    type="category"
                    width={140}
                    tick={{ fontSize: 12, fill: '#D1D5DB' }}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickFormatter={viewMode === 'time' ? formatListeningTime : undefined}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey={dataKey} fill="#22C55E" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Artist list */}
            <div className="space-y-1">
              {artists.map((artist, index) => (
                <div
                  key={artist.artist_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <span className="text-gray-500 text-sm w-6 text-right flex-shrink-0">
                    {index + 1}
                  </span>
                  {artist.artist_image_url ? (
                    <img
                      src={artist.artist_image_url}
                      alt={artist.artist_name}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{artist.artist_name}</p>
                    {artist.spotify_rank > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                        Spotify #{artist.spotify_rank}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-300 text-sm">{artist.play_count} plays</p>
                    <p className="text-gray-500 text-xs">{formatListeningTime(artist.listening_time_ms)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
