import { useState } from 'react'
import { Modal } from './Modal'
import { GoalForm } from './GoalForm'

export function GoalList({ 
  goals = [], 
  busy, 
  onUpdate, 
  onDelete,
  onCreate 
}) {
  const [editingGoal, setEditingGoal] = useState(null)
  const [error, setError] = useState('')

  function handleEdit(goal) {
    setError('')
    setEditingGoal(goal)
  }

  function handleCloseModal() {
    setEditingGoal(null)
    setError('')
  }

  async function handleUpdate(payload) {
    try {
      await onUpdate(editingGoal._id, payload)
      setEditingGoal(null)
      setError('')
    } catch (e) {
      setError(e?.message || 'Failed to update goal')
    }
  }

  async function handleDelete(goal) {
    const ok = window.confirm(
      `Delete goal "${goal.title}"?\n\nTasks linked to this goal will be unlinked.`
    )
    if (!ok) return

    try {
      await onDelete(goal._id)
    } catch (e) {
      setError(e?.message || 'Failed to delete goal')
    }
  }

  function formatDate(dateString) {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="manageList">
      <div className="manageListHeader">
        <h3>🎯 Goals</h3>
        <button 
          type="button" 
          className="button buttonSmall buttonPrimary"
          onClick={onCreate}
        >
          + Add Goal
        </button>
      </div>

      {error && <div className="errorMessage">{error}</div>}

      {goals.length === 0 ? (
        <div className="manageListEmpty">
          <p>No goals yet</p>
          <p className="hint">Create a goal to track long-term objectives</p>
        </div>
      ) : (
        <ul className="manageListItems">
          {goals.map((goal) => (
            <li key={goal._id} className="manageListItem">
              <div className="manageListItemContent">
                <div className="goalInfo">
                  <span className="manageListItemName">{goal.title}</span>
                  {goal.targetDate && (
                    <span className="goalTargetDate">
                      Target: {formatDate(goal.targetDate)}
                    </span>
                  )}
                </div>
                {goal.description && (
                  <span className="manageListItemDesc">{goal.description}</span>
                )}
              </div>
              <div className="manageListItemActions">
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => handleEdit(goal)}
                  title="Edit goal"
                  disabled={busy}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="iconButton iconButtonDanger"
                  onClick={() => handleDelete(goal)}
                  title="Delete goal"
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
        isOpen={!!editingGoal}
        onClose={handleCloseModal}
        title="Edit Goal"
      >
        <GoalForm
          mode="edit"
          initialGoal={editingGoal}
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
