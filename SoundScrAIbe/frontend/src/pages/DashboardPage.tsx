import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageShell from '../components/PageShell'

const QUICK_LINKS = [
  { label: 'Discover', description: 'AI-powered music recommendations', path: '/discover' },
  { label: 'Library', description: 'Browse your rated and shelved music', path: '/library' },
  { label: 'Listening History', description: 'See your recently played tracks', path: '/history' },
  { label: 'Stats', description: 'View your listening statistics', path: '/stats' },
  { label: 'Rankings', description: 'Your most listened-to artists', path: '/rankings' },
  { label: 'Search Music', description: 'Find tracks, albums, and artists', path: '/search' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <PageShell>
      {/* Welcome header */}
      <div className="flex items-center gap-4 mb-10">
        {user?.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-14 h-14 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.display_name}</h1>
          <p className="text-slate-400 text-sm">What do you want to explore today?</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="bg-slate-900 hover:bg-slate-800 rounded-xl p-5 transition-colors group"
          >
            <h3 className="text-white font-semibold mb-1 group-hover:text-indigo-400 transition-colors">
              {link.label}
            </h3>
            <p className="text-slate-400 text-sm">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-10 bg-slate-900 rounded-xl p-6 border border-slate-800">
        <p className="text-slate-400 text-sm text-center">
          Get started by searching for music and rating it. Build your personal music library over time.
        </p>
      </div>
    </PageShell>
  )
}
