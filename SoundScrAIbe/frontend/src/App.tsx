import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import CallbackPage from './pages/CallbackPage'
import ProfilePage from './pages/ProfilePage'
import ListeningHistoryPage from './pages/ListeningHistoryPage'
import ArtistChartsPage from './pages/ArtistChartsPage'
import TrackDetailPage from './pages/TrackDetailPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<ListeningHistoryPage />} />
        <Route path="/artist-charts" element={<ArtistChartsPage />} />
        <Route path="/track/:id" element={<TrackDetailPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
