import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingState from '../components/LoadingState'
import PageShell from '../components/PageShell'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return <LoadingState />

  return (
    <PageShell narrow>
      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-8">
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-28 h-28 rounded-full object-cover mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-1">{user.display_name}</h1>
        <a
          href={`https://open.spotify.com/user/${user.spotify_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors text-sm"
        >
          Open in Spotify
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{user.follower_count.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Followers</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{user.country.toUpperCase()}</p>
          <p className="text-sm text-slate-400">Country</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white capitalize">{user.product}</p>
          <p className="text-sm text-slate-400">Plan</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/library"
          className="bg-slate-900 hover:bg-slate-800 rounded-xl p-5 transition-colors text-center"
        >
          <p className="font-semibold text-white">My Library</p>
          <p className="text-sm text-slate-400 mt-1">Browse your collection</p>
        </Link>
        <Link
          to="/history"
          className="bg-slate-900 hover:bg-slate-800 rounded-xl p-5 transition-colors text-center"
        >
          <p className="font-semibold text-white">Listening History</p>
          <p className="text-sm text-slate-400 mt-1">Recently played</p>
        </Link>
      </div>

      {/* Account details */}
      <div className="bg-slate-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <span className="text-slate-400">Email</span>
          <span>{user.email}</span>
          <span className="text-slate-400">Spotify ID</span>
          <span className="font-mono text-slate-300">{user.spotify_id}</span>
        </div>
      </div>
    </PageShell>
  )
}
