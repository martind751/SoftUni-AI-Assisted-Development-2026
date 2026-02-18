import { useNavigate } from 'react-router-dom'
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
        <p className="text-gray-400 mb-6">@{user.spotify_id}</p>
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
