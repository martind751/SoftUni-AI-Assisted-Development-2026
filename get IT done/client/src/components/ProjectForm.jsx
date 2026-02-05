import { useEffect, useState } from 'react'

const defaultDraft = {
  name: '',
  description: ''
}

export function ProjectForm({ mode, initialProject, busy, error, onSubmit, onCancel, hideHeader = false }) {
  const [draft, setDraft] = useState(initialProject || defaultDraft)

  useEffect(() => {
    setDraft(initialProject || defaultDraft)
  }, [initialProject])

  function setField(name, value) {
    setDraft((d) => ({ ...d, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    const name = draft.name.trim()
    if (!name) return

    const payload = {
      name,
      description: draft.description?.trim() || ''
    }

    onSubmit(payload)
  }

  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Project'

  return (
    <form onSubmit={handleSubmit} className="form">
      {!hideHeader && <h2 className="cardTitle">{mode === 'edit' ? 'Edit Project' : 'New Project'}</h2>}

      <div className="field">
        <label className="label">Project Name</label>
        <input
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Enter project name..."
          disabled={busy}
          autoFocus={mode !== 'edit'}
        />
      </div>

      <div className="field">
        <label className="label">Description (optional)</label>
        <textarea
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Add project description..."
          disabled={busy}
          rows={3}
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