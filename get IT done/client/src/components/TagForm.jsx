import { useState } from 'react'

const defaultDraft = {
  name: ''
}

export function TagForm({ mode, initialTag, busy, error, onSubmit, onCancel, hideHeader = false }) {
  // Form is remounted with a new key when switching between create/edit, so no useEffect needed
  const [draft, setDraft] = useState(initialTag || defaultDraft)

  function setField(name, value) {
    setDraft((d) => ({ ...d, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    const name = draft.name.trim()
    if (!name) return

    const payload = { name }

    onSubmit(payload)
  }

  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Tag'

  return (
    <form onSubmit={handleSubmit} className="form">
      {!hideHeader && <h2 className="cardTitle">{mode === 'edit' ? 'Edit Tag' : 'New Tag'}</h2>}

      <div className="field">
        <label className="label">Tag Name</label>
        <input
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Enter tag name..."
          disabled={busy}
          autoFocus={mode !== 'edit'}
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
