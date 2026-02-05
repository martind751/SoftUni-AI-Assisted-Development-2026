import { useState } from 'react'
import { Modal } from './Modal'
import { CategoryForm } from './CategoryForm'

export function CategoryList({ 
  categories = [], 
  busy, 
  onUpdate, 
  onDelete,
  onCreate 
}) {
  const [editingCategory, setEditingCategory] = useState(null)
  const [error, setError] = useState('')

  function handleEdit(category) {
    setError('')
    setEditingCategory(category)
  }

  function handleCloseModal() {
    setEditingCategory(null)
    setError('')
  }

  async function handleUpdate(payload) {
    try {
      await onUpdate(editingCategory._id, payload)
      setEditingCategory(null)
      setError('')
    } catch (e) {
      setError(e?.message || 'Failed to update category')
    }
  }

  async function handleDelete(category) {
    const ok = window.confirm(
      `Delete category "${category.name}"?\n\nTasks assigned to this category will become uncategorized.`
    )
    if (!ok) return

    try {
      await onDelete(category._id)
    } catch (e) {
      setError(e?.message || 'Failed to delete category')
    }
  }

  return (
    <div className="manageList">
      <div className="manageListHeader">
        <h3>🏷️ Categories</h3>
        <button 
          type="button" 
          className="button buttonSmall buttonPrimary"
          onClick={onCreate}
        >
          + Add Category
        </button>
      </div>

      {error && <div className="errorMessage">{error}</div>}

      {categories.length === 0 ? (
        <div className="manageListEmpty">
          <p>No categories yet</p>
          <p className="hint">Create a category to label your tasks</p>
        </div>
      ) : (
        <ul className="manageListItems">
          {categories.map((category) => (
            <li key={category._id} className="manageListItem">
              <div className="manageListItemContent">
                <span 
                  className="categoryColorDot"
                  style={{ backgroundColor: category.color || '#6b7280' }}
                />
                <span className="manageListItemName">{category.name}</span>
              </div>
              <div className="manageListItemActions">
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => handleEdit(category)}
                  title="Edit category"
                  disabled={busy}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="iconButton iconButtonDanger"
                  onClick={() => handleDelete(category)}
                  title="Delete category"
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
        isOpen={!!editingCategory}
        onClose={handleCloseModal}
        title="Edit Category"
      >
        <CategoryForm
          mode="edit"
          initialCategory={editingCategory}
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
