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

export async function listProjects() {
  const res = await fetch('/api/projects')
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to load projects'))
  return payload?.projects || []
}

export async function createProject(project) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to create project'))
  return payload?.project
}

export async function updateProject(id, patch) {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to update project'))
  return payload?.project
}

export async function deleteProject(id) {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const payload = await readJson(res)
    throw new Error(getErrorMessage(payload, 'Failed to delete project'))
  }
}
