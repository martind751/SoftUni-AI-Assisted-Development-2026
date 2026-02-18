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
