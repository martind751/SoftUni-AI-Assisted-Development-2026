import { Routes, Route, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoadingState from './components/LoadingState'
import HomePage from './pages/HomePage'
import CallbackPage from './pages/CallbackPage'
import ProfilePage from './pages/ProfilePage'
import ListeningHistoryPage from './pages/ListeningHistoryPage'
import TrackDetailPage from './pages/TrackDetailPage'
import AlbumDetailPage from './pages/AlbumDetailPage'
import ArtistDetailPage from './pages/ArtistDetailPage'
import LibraryLandingPage from './pages/LibraryLandingPage'
import LibraryGroupPage from './pages/LibraryGroupPage'
import SearchPage from './pages/SearchPage'
import StatsPage from './pages/StatsPage'
import RankingsPage from './pages/RankingsPage'
import DashboardPage from './pages/DashboardPage'

function AuthLayout() {
  const { isLoggedIn, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate('/')
  }, [loading, isLoggedIn, navigate])

  if (loading) return <LoadingState />

  if (!isLoggedIn) return null

  return (
    <>
      <Navbar />
      <main className="pt-0">
        <Outlet />
      </main>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<ListeningHistoryPage />} />
          <Route path="/track/:id" element={<TrackDetailPage />} />
          <Route path="/album/:id" element={<AlbumDetailPage />} />
          <Route path="/artist/:id" element={<ArtistDetailPage />} />
          <Route path="/library" element={<LibraryLandingPage />} />
          <Route path="/library/:group" element={<LibraryGroupPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
