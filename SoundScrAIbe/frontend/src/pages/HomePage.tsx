import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSpotifyAuthConfig } from '../lib/api'
import { generateCodeVerifier, generateCodeChallenge } from '../lib/pkce'
import LoadingState from '../components/LoadingState'

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-indigo-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function ShelfIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-indigo-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-indigo-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: <StarIcon />,
    title: 'Rate & Review',
    description: 'Rate tracks, albums, and artists on a 1-10 scale. Build your personal ratings library.',
  },
  {
    icon: <ShelfIcon />,
    title: 'Organize',
    description: 'Mark what\'s On Rotation, build your listening backlog, and organize with tags.',
  },
  {
    icon: <TagIcon />,
    title: 'Tag & Discover',
    description: 'Create custom tags to categorize your music and discover patterns in your taste.',
  },
]

function LoggedOutHome() {
  const handleLogin = async () => {
    const config = await getSpotifyAuthConfig()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    localStorage.setItem('code_verifier', codeVerifier)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.client_id,
      scope: config.scope,
      redirect_uri: config.redirect_uri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true',
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <h1 className="text-6xl sm:text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">
          SoundScrAIbe
        </h1>
        <p className="text-xl sm:text-2xl text-slate-300 mb-3">Your personal music diary</p>
        <p className="text-slate-400 max-w-md text-center mb-12">
          Rate, organize, and track your music journey.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full mb-14">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-slate-900 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleLogin}
          className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-10 py-3.5 rounded-full text-lg transition-colors"
        >
          Sign in with Spotify
        </button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { isLoggedIn, loading } = useAuth()

  if (loading) return <LoadingState />

  if (isLoggedIn) return <Navigate to="/dashboard" replace />
  return <LoggedOutHome />
}
