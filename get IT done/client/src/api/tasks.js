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

export async function listTasks() {
  const res = await fetch('/api/tasks')
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to load tasks'))
  return payload?.tasks || []
}

export async function createTask(task) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to create task'))
  return payload?.task
}

export async function updateTask(id, patch) {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to update task'))
  return payload?.task
}

export async function deleteTask(id) {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    const payload = await readJson(res)
    throw new Error(getErrorMessage(payload, 'Failed to delete task'))
  }
}
