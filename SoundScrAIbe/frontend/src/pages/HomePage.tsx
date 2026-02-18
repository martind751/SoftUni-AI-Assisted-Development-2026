import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSpotifyAuthConfig } from '../lib/api'
import { generateCodeVerifier, generateCodeChallenge } from '../lib/pkce'

export default function HomePage() {
  const { isLoggedIn, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isLoggedIn) {
      navigate('/profile')
    }
  }, [loading, isLoggedIn, navigate])

  const handleLogin = async () => {
    const config = await getSpotifyAuthConfig()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    sessionStorage.setItem('code_verifier', codeVerifier)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.client_id,
      scope: config.scope,
      redirect_uri: config.redirect_uri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">SoundScrAIbe</h1>
        <p className="text-gray-400 mb-8">Your personal music diary</p>
        <button
          onClick={handleLogin}
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-3 rounded-full transition-colors"
        >
          Sign in with Spotify
        </button>
      </div>
    </div>
  )
}
