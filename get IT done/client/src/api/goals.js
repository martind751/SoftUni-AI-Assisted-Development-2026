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

export async function listGoals() {
  const res = await fetch('/api/goals')
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to load goals'))
  return payload?.goals || []
}

export async function createGoal(goal) {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to create goal'))
  return payload?.goal
}

export async function updateGoal(id, patch) {
  const res = await fetch(`/api/goals/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  const payload = await readJson(res)
  if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to update goal'))
  return payload?.goal
}

export async function deleteGoal(id) {
  const res = await fetch(`/api/goals/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const payload = await readJson(res)
    throw new Error(getErrorMessage(payload, 'Failed to delete goal'))
  }
}
