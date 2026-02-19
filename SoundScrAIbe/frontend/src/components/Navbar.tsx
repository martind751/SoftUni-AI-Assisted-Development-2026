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

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
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
    label: 'History',
    path: '/history',
    matchPrefixes: ['/history'],
    icon: <ClockIcon />,
  },
  {
    label: 'Charts',
    path: '/artist-charts',
    matchPrefixes: ['/artist-charts'],
    icon: <ChartIcon />,
  },
  {
    label: 'Stats',
    path: '/stats',
    matchPrefixes: ['/stats'],
    icon: <StatsIcon />,
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
