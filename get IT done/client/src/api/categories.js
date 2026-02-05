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

export async function listCategories() {
  const res = await fetch('/api/categories')
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to load categories'))
  return payload?.categories || []
}

export async function createCategory(category) {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to create category'))
  return payload?.category
}

export async function updateCategory(id, patch) {
  const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to update category'))
  return payload?.category
}

export async function deleteCategory(id) {
  const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const payload = await readJson(res)
    throw new Error(getErrorMessage(payload, 'Failed to delete category'))
  }
}
