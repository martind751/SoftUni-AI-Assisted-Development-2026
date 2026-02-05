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

export async function listTags() {
  const res = await fetch('/api/tags')
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to load tags'))
  return payload?.tags || []
}

export async function createTag(tag) {
  const res = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tag)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to create tag'))
  return payload?.tag
}

export async function updateTag(id, patch) {
  const res = await fetch(`/api/tags/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to update tag'))
  return payload?.tag
}

export async function deleteTag(id) {
  const res = await fetch(`/api/tags/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const payload = await readJson(res)
    throw new Error(getErrorMessage(payload, 'Failed to delete tag'))
  }
}
