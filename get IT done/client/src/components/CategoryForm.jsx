import { useState } from 'react'

const defaultDraft = {
  name: '',
  color: '#3b82f6'
}

const colorOptions = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' }
]

export function CategoryForm({ mode, initialCategory, busy, error, onSubmit, onCancel, hideHeader = false }) {
  // Form is remounted with a new key when switching between create/edit, so no useEffect needed
  const [draft, setDraft] = useState(initialCategory || defaultDraft)

  function setField(name, value) {
    setDraft((d) => ({ ...d, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    const name = draft.name.trim()
    if (!name) return

    const payload = {
      name,
      color: draft.color || '#6b7280'
    }

    onSubmit(payload)
  }

  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Category'

  return (
    <form onSubmit={handleSubmit} className="form">
      {!hideHeader && <h2 className="cardTitle">{mode === 'edit' ? 'Edit Category' : 'New Category'}</h2>}

      <div className="field">
        <label className="label">Category Name</label>
        <input
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Enter category name..."
          disabled={busy}
          autoFocus={mode !== 'edit'}
        />
      </div>

      <div className="field">
        <label className="label">Color</label>
        <div className="colorPickerRow">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`colorOption ${draft.color === option.value ? 'selected' : ''}`}
              style={{ backgroundColor: option.value }}
              onClick={() => setField('color', option.value)}
              title={option.label}
              disabled={busy}
            />
          ))}
          <div className="colorCustom" title="Custom color">
            <span className="colorCustomIcon">+</span>
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setField('color', e.target.value)}
              className="colorInput"
              disabled={busy}
              aria-label="Custom color"
            />
          </div>
        </div>
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