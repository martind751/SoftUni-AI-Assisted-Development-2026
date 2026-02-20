import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  label: string
  path: string
  matchPrefixes: string[]
  icon: React.ReactNode
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M15.003 11.078a7.454 7.454 0 01-.982 3.172M9.497 14.25a7.454 7.454 0 01.981-3.172M15.003 11.078a68.066 68.066 0 00-5.505 0M9.497 14.25c1.768.266 3.6.339 5.506.196" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16v-3m4 3v-6m4 6v-4m4 4V7" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Discover',
    path: '/discover',
    matchPrefixes: ['/discover'],
    icon: <SparklesIcon />,
  },
  {
    label: 'History',
    path: '/history',
    matchPrefixes: ['/history'],
    icon: <ClockIcon />,
  },
{
    label: 'Stats',
    path: '/stats',
    matchPrefixes: ['/stats'],
    icon: <StatsIcon />,
  },
  {
    label: 'Rankings',
    path: '/rankings',
    matchPrefixes: ['/rankings'],
    icon: <TrophyIcon />,
  },
  {
    label: 'Library',
    path: '/library',
    matchPrefixes: ['/library', '/track/', '/album/', '/artist/'],
    icon: <BookIcon />,
  },
]

function isActive(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname.startsWith(prefix))
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isHome = location.pathname === '/'
  const isSearchActive = location.pathname === '/search'

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className={`text-lg font-bold transition-colors flex-shrink-0 ${
            isHome ? 'text-indigo-400' : 'text-white hover:text-indigo-400'
          }`}
        >
          SoundScrAIbe
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(location.pathname, item.matchPrefixes)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Search + User avatar + logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/search"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isSearchActive
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Search"
            title="Search"
            aria-current={isSearchActive ? 'page' : undefined}
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search</span>
          </Link>

          {user?.avatar_url && (
            <Link to="/profile" aria-label="View profile" title="View profile">
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-indigo-400 transition-all"
              />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Log out"
            title="Log out"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </nav>
  )
}
