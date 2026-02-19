import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, loading, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/')
    }
  }, [loading, isLoggedIn, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-2">{user.display_name}</h1>
        <a
          href={`https://open.spotify.com/user/${user.spotify_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 hover:text-green-300 hover:underline transition-colors inline-block mb-6"
        >
          Open in Spotify
        </a>
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm text-left mb-6">
          <span className="text-gray-400">Email</span>
          <span>{user.email}</span>
          <span className="text-gray-400">Country</span>
          <span>{user.country.toUpperCase()}</span>
          <span className="text-gray-400">Subscription</span>
          <span>{user.product.charAt(0).toUpperCase() + user.product.slice(1)}</span>
          <span className="text-gray-400">Followers</span>
          <span>{user.follower_count.toLocaleString()}</span>
        </div>
        <Link
          to="/history"
          className="text-green-400 hover:text-green-300 hover:underline transition-colors inline-block mb-6"
        >
          Listening History &rarr;
        </Link>
        <br />
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
