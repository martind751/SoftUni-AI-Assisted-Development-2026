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
