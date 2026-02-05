async function readJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function getErrorMessage(payload, fallback) {
  const msg = payload?.error?.message || payload?.message
  return msg || fallback
}

export async function getStats() {
  const res = await fetch('/api/stats')
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to load statistics'))
  return payload?.stats || null
}
