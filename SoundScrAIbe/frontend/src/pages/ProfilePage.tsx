import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <div className="bg-slate-900 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-bold">{user.display_name}</h2>
              <a
                href={`https://open.spotify.com/user/${user.spotify_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors text-sm"
              >
                Open in Spotify
              </a>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <span className="text-slate-400">Email</span>
            <span>{user.email}</span>
            <span className="text-slate-400">Country</span>
            <span>{user.country.toUpperCase()}</span>
            <span className="text-slate-400">Subscription</span>
            <span>{user.product.charAt(0).toUpperCase() + user.product.slice(1)}</span>
            <span className="text-slate-400">Followers</span>
            <span>{user.follower_count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
