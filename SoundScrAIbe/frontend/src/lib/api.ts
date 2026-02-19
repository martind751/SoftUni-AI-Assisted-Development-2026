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
  rating: number | null
  shelf: string | null
  tags: string[]
}

export async function getTrack(id: string): Promise<TrackDetail> {
  const res = await fetch(`/api/tracks/${id}`)
  if (!res.ok) throw new Error('Failed to fetch track')
  return res.json()
}

// --- Rating/Shelf/Tags types ---

export interface AlbumArtist {
  id: string
  name: string
}

export interface AlbumImage {
  url: string
  height: number
  width: number
}

export interface AlbumDetail {
  id: string
  name: string
  album_type: string
  release_date: string
  total_tracks: number
  label: string
  popularity: number
  genres: string[]
  artists: AlbumArtist[]
  images: AlbumImage[]
  spotify_url: string
  rating: number | null
  shelf: string | null
  tags: string[]
}

export async function getAlbum(id: string): Promise<AlbumDetail> {
  const res = await fetch(`/api/albums/${id}`)
  if (!res.ok) throw new Error('Failed to fetch album')
  return res.json()
}

export interface ArtistDetail {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: number
  images: AlbumImage[]
  spotify_url: string
  listening_stats: ListeningStats
  rating: number | null
  shelf: string | null
  tags: string[]
}

export async function getArtist(id: string): Promise<ArtistDetail> {
  const res = await fetch(`/api/artists/${id}`)
  if (!res.ok) throw new Error('Failed to fetch artist')
  return res.json()
}

export async function setRating(
  entityType: string, entityId: string, score: number,
  name: string, imageUrl: string
): Promise<void> {
  const res = await fetch(`/api/ratings/${entityType}/${entityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, name, image_url: imageUrl }),
  })
  if (!res.ok) throw new Error('Failed to set rating')
}

export async function deleteRating(entityType: string, entityId: string): Promise<void> {
  const res = await fetch(`/api/ratings/${entityType}/${entityId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete rating')
}

export async function setShelf(
  entityType: string, entityId: string, status: string,
  name: string, imageUrl: string
): Promise<void> {
  const res = await fetch(`/api/shelves/${entityType}/${entityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, name, image_url: imageUrl }),
  })
  if (!res.ok) throw new Error('Failed to set shelf')
}

export async function deleteShelf(entityType: string, entityId: string): Promise<void> {
  const res = await fetch(`/api/shelves/${entityType}/${entityId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete shelf')
}

export async function setTags(
  entityType: string, entityId: string, tags: string[],
  name: string, imageUrl: string
): Promise<void> {
  const res = await fetch(`/api/tags/${entityType}/${entityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags, name, image_url: imageUrl }),
  })
  if (!res.ok) throw new Error('Failed to set tags')
}

export async function getUserTags(): Promise<{ id: number; name: string }[]> {
  const res = await fetch('/api/tags')
  if (!res.ok) throw new Error('Failed to fetch tags')
  const data = await res.json()
  return data.tags
}

export interface LibraryItem {
  entity_type: string
  entity_id: string
  name: string
  image_url: string
  rating: number | null
  shelf: string | null
  tags: string[]
  extra: Record<string, string>
}

export interface LibraryResponse {
  items: LibraryItem[]
  total: number
  page: number
  limit: number
}

// --- Search types ---

export interface SearchTrack {
  id: string
  name: string
  artists: string[]
  album: string
  album_cover: string
  duration_ms: number
}

export interface SearchAlbum {
  id: string
  name: string
  artists: string[]
  image_url: string
  release_date: string
  album_type: string
}

export interface SearchArtist {
  id: string
  name: string
  image_url: string
  genres: string[]
  followers: number
}

export interface SearchResult {
  tracks: SearchTrack[]
  albums: SearchAlbum[]
  artists: SearchArtist[]
}

export async function search(query: string, types: string[] = ['track', 'album', 'artist']): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query, types: types.join(',') })
  const res = await fetch(`/api/search?${params}`)
  if (!res.ok) throw new Error('Failed to search')
  return res.json()
}

export async function getLibrary(params: {
  entity_type?: string
  shelf?: string
  tag?: string
  rated?: string
  sort?: string
  page?: number
  limit?: number
}): Promise<LibraryResponse> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') searchParams.set(k, String(v))
  })
  const res = await fetch(`/api/library?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch library')
  return res.json()
}

export interface GroupSummary {
  count: number
  covers: string[]
}

export interface LibrarySummary {
  rated: GroupSummary
  on_rotation: GroupSummary
  want_to_listen: GroupSummary
  favorites: GroupSummary
}

export async function getLibrarySummary(entityType?: string): Promise<LibrarySummary> {
  const params = new URLSearchParams()
  if (entityType) params.set('entity_type', entityType)
  const query = params.toString()
  const res = await fetch(`/api/library/summary${query ? '?' + query : ''}`)
  if (!res.ok) throw new Error('Failed to fetch library summary')
  return res.json()
}

export async function getFavorites(params: {
  entity_type?: string
  page?: number
  limit?: number
}): Promise<LibraryResponse> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') searchParams.set(k, String(v))
  })
  const res = await fetch(`/api/library/favorites?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch favorites')
  return res.json()
}
