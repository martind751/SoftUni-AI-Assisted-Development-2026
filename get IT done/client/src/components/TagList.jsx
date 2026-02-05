import { useState } from 'react'
import { Modal } from './Modal'
import { TagForm } from './TagForm'

export function TagList({ 
  tags = [], 
  busy, 
  onUpdate, 
  onDelete,
  onCreate 
}) {
  const [editingTag, setEditingTag] = useState(null)
  const [error, setError] = useState('')

  function handleEdit(tag) {
    setError('')
    setEditingTag(tag)
  }

  function handleCloseModal() {
    setEditingTag(null)
    setError('')
  }

  async function handleUpdate(payload) {
    try {
      await onUpdate(editingTag._id, payload)
      setEditingTag(null)
      setError('')
    } catch (e) {
      setError(e?.message || 'Failed to update tag')
    }
  }

  async function handleDelete(tag) {
    const ok = window.confirm(
      `Delete tag "${tag.name}"?\n\nThis tag will be removed from all tasks.`
    )
    if (!ok) return

    try {
      await onDelete(tag._id)
    } catch (e) {
      setError(e?.message || 'Failed to delete tag')
    }
  }

  return (
    <div className="manageList">
      <div className="manageListHeader">
        <h3>🔖 Tags</h3>
        <button 
          type="button" 
          className="button buttonSmall buttonPrimary"
          onClick={onCreate}
        >
          + Add Tag
        </button>
      </div>

      {error && <div className="errorMessage">{error}</div>}

      {tags.length === 0 ? (
        <div className="manageListEmpty">
          <p>No tags yet</p>
          <p className="hint">Create tags to label and filter tasks</p>
        </div>
      ) : (
        <ul className="manageListItems">
          {tags.map((tag) => (
            <li key={tag._id} className="manageListItem">
              <div className="manageListItemContent">
                <span className="tagBadge">{tag.name}</span>
              </div>
              <div className="manageListItemActions">
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => handleEdit(tag)}
                  title="Edit tag"
                  disabled={busy}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="iconButton iconButtonDanger"
                  onClick={() => handleDelete(tag)}
                  title="Delete tag"
                  disabled={busy}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={!!editingTag}
        onClose={handleCloseModal}
        title="Edit Tag"
      >
        <TagForm
          mode="edit"
          initialTag={editingTag}
          busy={busy}
          error={error}
          onSubmit={handleUpdate}
          onCancel={handleCloseModal}
          hideHeader
        />
      </Modal>
    </div>
  )
}
