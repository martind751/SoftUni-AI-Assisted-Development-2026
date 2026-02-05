import { useState } from 'react'

const defaultDraft = {
  title: '',
  description: '',
  targetDate: ''
}

function getInitialDraft(initialGoal) {
  if (!initialGoal) return defaultDraft
  return {
    ...initialGoal,
    targetDate: initialGoal.targetDate 
      ? new Date(initialGoal.targetDate).toISOString().split('T')[0] 
      : ''
  }
}

export function GoalForm({ mode, initialGoal, busy, error, onSubmit, onCancel, hideHeader = false }) {
  // Form is remounted with a new key when switching between create/edit, so no useEffect needed
  const [draft, setDraft] = useState(() => getInitialDraft(initialGoal))

  function setField(name, value) {
    setDraft((d) => ({ ...d, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    const title = draft.title.trim()
    if (!title) return

    const payload = {
      title,
      description: draft.description?.trim() || ''
    }

    if (draft.targetDate) {
      payload.targetDate = new Date(draft.targetDate).toISOString()
    }

    onSubmit(payload)
  }

  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Goal'

  return (
    <form onSubmit={handleSubmit} className="form">
      {!hideHeader && <h2 className="cardTitle">{mode === 'edit' ? 'Edit Goal' : 'New Goal'}</h2>}

      <div className="field">
        <label className="label">Goal Title</label>
        <input
          value={draft.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Enter goal title..."
          disabled={busy}
          autoFocus={mode !== 'edit'}
        />
      </div>

      <div className="field">
        <label className="label">Description (optional)</label>
        <textarea
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Add goal description..."
          disabled={busy}
          rows={3}
        />
      </div>

      <div className="field">
        <label className="label">Target Date (optional)</label>
        <input
          type="date"
          value={draft.targetDate}
          onChange={(e) => setField('targetDate', e.target.value)}
          disabled={busy}
        />
      </div>

      {error ? <div className="errorMessage">{error}</div> : null}

      <div className="actions">
        <button type="submit" className="button buttonPrimary" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14, marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }}></span>
              Working...
            </>
          ) : submitLabel}
        </button>
        {mode === 'edit' ? (
          <button type="button" className="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
