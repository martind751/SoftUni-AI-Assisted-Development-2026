import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PillGroup from '../components/PillGroup'
import PageShell from '../components/PageShell'
import { formatNumber } from '../lib/format'
import {
  getStatsOverview,
  getListeningClock,
  type StatsOverview,
  type StatsPeriod,
  type ListeningClock,
} from '../lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// --- Helpers ---

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null || pct === undefined) return null
  const isPositive = pct >= 0
  const sign = isPositive ? '+' : ''
  return (
    <span className={`text-sm ${isPositive ? 'text-indigo-400' : 'text-red-400'}`}>
      {sign}{Math.round(pct)}%
    </span>
  )
}

// --- Constants ---

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'lifetime', label: 'Lifetime' },
]

const STAT_LABELS: { key: keyof StatsOverview['stats']; label: string }[] = [
  { key: 'streams', label: 'streams' },
  { key: 'minutes', label: 'minutes streamed' },
  { key: 'hours', label: 'hours streamed' },
  { key: 'different_tracks', label: 'different tracks' },
  { key: 'different_artists', label: 'different artists' },
  { key: 'different_albums', label: 'different albums' },
]

// --- Sections ---

function OverviewSection() {
  const { isLoggedIn } = useAuth()
  const [data, setData] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<StatsPeriod>('week')

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    setError('')
    getStatsOverview(period)
      .then(setData)
      .catch(() => setError('Failed to load stats overview'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, period])

  const allZero = data
    ? STAT_LABELS.every((s) => data.stats[s.key].value === 0)
    : false

  return (
    <section>
      {/* Period tabs */}
      <div className="mb-6">
        <PillGroup options={PERIOD_OPTIONS} value={period} onChange={setPeriod} size="md" />
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : error ? (
        <p className="text-red-400 text-center py-8">{error}</p>
      ) : allZero ? (
        <p className="text-slate-400 text-center py-8">No listening data for this period</p>
      ) : data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {STAT_LABELS.map(({ key, label }) => {
            const stat = data.stats[key]
            return (
              <div key={key} className="bg-slate-900 rounded-xl p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-indigo-400">
                    {formatNumber(Math.round(stat.value * 10) / 10)}
                  </span>
                  <ChangeBadge pct={stat.change_pct} />
                </div>
                <p className="text-sm text-slate-400 mt-1">{label}</p>
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

function ClockSection() {
  const { isLoggedIn } = useAuth()
  const [data, setData] = useState<ListeningClock | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    setError('')
    getListeningClock()
      .then(setData)
      .catch(() => setError('Failed to load listening clock'))
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  const hours = data?.hours ?? Array.from({ length: 24 }, (_, i) => ({ hour: i, streams: 0, minutes: 0 }))
  const chartData = hours.map((h) => ({
    ...h,
    hourLabel: `${h.hour}`,
  }))

  return (
    <section className="mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Listening Activity</h3>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : error ? (
        <p className="text-red-400 text-center py-8">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Streams bar chart */}
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="text-sm font-medium text-slate-400 mb-3">Streams by hour</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="hourLabel"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelFormatter={(label) => `${label}:00`}
                  formatter={(value) => [`${value} streams`, '']}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="streams" fill="#6366F1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Minutes bar chart */}
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="text-sm font-medium text-slate-400 mb-3">Minutes by hour</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="hourLabel"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelFormatter={(label) => `${label}:00`}
                  formatter={(value) => [`${Math.round(value as number)} min`, '']}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="minutes" fill="#6366F1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  )
}

// --- Main Page ---

export default function StatsPage() {
  return (
    <PageShell title="Stats">
        <OverviewSection />
        <ClockSection />
    </PageShell>
  )
}
