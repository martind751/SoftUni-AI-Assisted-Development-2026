import { useEffect, useMemo, useState } from 'react'

const defaultDraft = {
  title: '',
  description: '',
  priority: 2,
  status: 'todo',
  dueDate: '',
  projectId: '',
  categoryId: '',
  goalId: '',
  tags: []
}

function toInputDateString(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function TaskForm({ mode, initialTask, busy, error, projects = [], categories = [], goals = [], tags = [], onSubmit, onCancel, hideHeader = false }) {
  const initialDraft = useMemo(() => {
    if (!initialTask) return defaultDraft

    return {
      title: initialTask.title || '',
      description: initialTask.description || '',
      priority: initialTask.priority ?? 2,
      status: initialTask.status || 'todo',
      dueDate: toInputDateString(initialTask.dueDate),
      projectId: initialTask.projectId?._id || initialTask.projectId || '',
      categoryId: initialTask.categoryId?._id || initialTask.categoryId || '',
      goalId: initialTask.goalId?._id || initialTask.goalId || '',
      tags: initialTask.tags?.map(t => t._id || t) || []
    }
  }, [initialTask])

  const [draft, setDraft] = useState(initialDraft)

  useEffect(() => {
    setDraft(initialDraft)
  }, [initialDraft])

  function setField(name, value) {
    setDraft((d) => ({ ...d, [name]: value }))
  }

  async function handleProjectChange(e) {
    setField('projectId', e.target.value)
  }

  async function handleCategoryChange(e) {
    setField('categoryId', e.target.value)
  }

  function handleSubmit(e) {
    e.preventDefault()

    const title = draft.title.trim()
    if (!title) return

    const payload = {
      title,
      description: draft.description?.trim() || ''
    }

    if (draft.priority !== '' && draft.priority != null) payload.priority = Number(draft.priority)
    if (draft.status) payload.status = draft.status
    if (draft.dueDate) payload.dueDate = new Date(draft.dueDate).toISOString()
    if (draft.projectId) payload.projectId = draft.projectId
    else payload.projectId = null
    if (draft.categoryId) payload.categoryId = draft.categoryId
    else payload.categoryId = null
    if (draft.goalId) payload.goalId = draft.goalId
    else payload.goalId = null
    if (draft.tags?.length > 0) payload.tags = draft.tags
    else payload.tags = []

    onSubmit(payload)
  }

  function handleTagToggle(tagId) {
    setDraft((d) => {
      const currentTags = d.tags || []
      if (currentTags.includes(tagId)) {
        return { ...d, tags: currentTags.filter((t) => t !== tagId) }
      } else {
        return { ...d, tags: [...currentTags, tagId] }
      }
    })
  }

  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Add Task'

  return (
    <form onSubmit={handleSubmit} className="form">
      {!hideHeader && <h2 className="cardTitle">{mode === 'edit' ? 'Edit Task' : 'New Task'}</h2>}

      <div className="field">
        <label className="label">What needs to be done?</label>
        <input
          value={draft.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Enter your task..."
          disabled={busy}
          autoFocus={mode !== 'edit'}
        />
      </div>

      <div className="field">
        <label className="label">Details (optional)</label>
        <textarea
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Add any notes or context..."
          disabled={busy}
          rows={3}
        />
      </div>

      <div className="row3">
        <div className="field">
          <label className="label">Priority</label>
          <select
            value={draft.priority}
            onChange={(e) => setField('priority', e.target.value)}
            disabled={busy}
          >
            <option value={1}>High</option>
            <option value={2}>Medium</option>
            <option value={3}>Normal</option>
            <option value={4}>Low</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Status</label>
          <select
            value={draft.status}
            onChange={(e) => setField('status', e.target.value)}
            disabled={busy}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Due Date</label>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(e) => setField('dueDate', e.target.value)}
            disabled={busy}
          />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label className="label">Project</label>
          <select
            value={draft.projectId}
            onChange={handleProjectChange}
            disabled={busy}
          >
            <option value="">— No Project —</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Category</label>
          <select
            value={draft.categoryId}
            onChange={handleCategoryChange}
            disabled={busy}
          >
            <option value="">— No Category —</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label className="label">Goal</label>
          <select
            value={draft.goalId}
            onChange={(e) => setField('goalId', e.target.value)}
            disabled={busy}
          >
            <option value="">— No Goal —</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>{g.title}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Tags</label>
          <div className="tagSelector">
            {tags.length === 0 ? (
              <span className="noTags">No tags available</span>
            ) : (
              tags.map((tag) => (
                <button
                  key={tag._id}
                  type="button"
                  className={`tagOption ${draft.tags?.includes(tag._id) ? 'selected' : ''}`}
                  onClick={() => handleTagToggle(tag._id)}
                  disabled={busy}
                >
                  {tag.name}
                </button>
              ))
            )}
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
