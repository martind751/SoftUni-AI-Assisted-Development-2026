export async function getSpotifyAuthConfig(): Promise<{
  client_id: string
  redirect_uri: string
  scope: string
}> {
  const res = await fetch('/api/auth/spotify')
  if (!res.ok) throw new Error('Failed to get auth config')
  return res.json()
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<{ ok: boolean }> {
  const res = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  return res.json()
}

export interface UserProfile {
  spotify_id: string
  display_name: string
  avatar_url: string
  email: string
  country: string
  product: string
  follower_count: number
}

export async function getMe(): Promise<UserProfile | null> {
  const res = await fetch('/api/me')
  if (res.status === 401) return null
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

export interface RecentTrack {
  id: string
  played_at: string
  name: string
  artists: string[]
  album: string
  album_cover: string
  duration_ms: number
}

export async function getRecentlyPlayed(): Promise<RecentTrack[]> {
  const res = await fetch('/api/recently-played')
  if (!res.ok) throw new Error('Failed to fetch recently played')
  const data = await res.json()
  return data.items
}

export async function checkLikedSongs(ids: string[]): Promise<Record<string, boolean>> {
  const res = await fetch(`/api/liked-songs/check?ids=${ids.join(',')}`)
  if (!res.ok) throw new Error('Failed to check liked songs')
  const data = await res.json()
  return data.results
}

export async function saveLikedSong(trackId: string): Promise<void> {
  const res = await fetch(`/api/liked-songs/${trackId}`, { method: 'PUT' })
  if (!res.ok) throw new Error('Failed to save track')
}

export async function removeLikedSong(trackId: string): Promise<void> {
  const res = await fetch(`/api/liked-songs/${trackId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove track')
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export interface ArtistChartItem {
  artist_id: string
  artist_name: string
  artist_image_url: string
  play_count: number
  listening_time_ms: number
  spotify_rank: number
}

export interface ArtistChartsData {
  time_range: TimeRange
  synced_at: string
  artists: ArtistChartItem[]
}

export async function getArtistCharts(timeRange: TimeRange = 'medium_term'): Promise<ArtistChartsData> {
  const res = await fetch(`/api/artist-charts?time_range=${timeRange}`)
  if (!res.ok) throw new Error('Failed to fetch artist charts')
  return res.json()
}

export interface TrackArtist {
  id: string
  name: string
}

export interface AudioFeatures {
  danceability: number
  energy: number
  acousticness: number
  instrumentalness: number
  liveness: number
  speechiness: number
  valence: number
  tempo: number
  key: number
  mode: number
  loudness: number
  time_signature: number
}

export interface ListeningStats {
  play_count: number
  first_played?: string
  last_played?: string
}

export interface TrackDetail {
  id: string
  name: string
  duration_ms: number
  explicit: boolean
  track_number: number
  disc_number: number
  preview_url: string | null
  artists: TrackArtist[]
  album_name: string
  album_id: string
  album_cover: string
  release_date: string
  total_tracks: number
  spotify_url: string
  is_liked: boolean
  audio_features: AudioFeatures | null
  listening_stats: ListeningStats
}

export async function getTrack(id: string): Promise<TrackDetail> {
  const res = await fetch(`/api/tracks/${id}`)
  if (!res.ok) throw new Error('Failed to fetch track')
  return res.json()
}
