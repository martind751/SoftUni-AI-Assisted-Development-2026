import { useState } from 'react'
import { Modal } from './Modal'
import { ProjectForm } from './ProjectForm'

export function ProjectList({ 
  projects = [], 
  busy, 
  onUpdate, 
  onDelete,
  onCreate 
}) {
  const [editingProject, setEditingProject] = useState(null)
  const [error, setError] = useState('')

  function handleEdit(project) {
    setError('')
    setEditingProject(project)
  }

  function handleCloseModal() {
    setEditingProject(null)
    setError('')
  }

  async function handleUpdate(payload) {
    try {
      await onUpdate(editingProject._id, payload)
      setEditingProject(null)
      setError('')
    } catch (e) {
      setError(e?.message || 'Failed to update project')
    }
  }

  async function handleDelete(project) {
    const ok = window.confirm(
      `Delete project "${project.name}"?\n\nTasks assigned to this project will become unassigned.`
    )
    if (!ok) return

    try {
      await onDelete(project._id)
    } catch (e) {
      setError(e?.message || 'Failed to delete project')
    }
  }

  return (
    <div className="manageList">
      <div className="manageListHeader">
        <h3>📁 Projects</h3>
        <button 
          type="button" 
          className="button buttonSmall buttonPrimary"
          onClick={onCreate}
        >
          + Add Project
        </button>
      </div>

      {error && <div className="errorMessage">{error}</div>}

      {projects.length === 0 ? (
        <div className="manageListEmpty">
          <p>No projects yet</p>
          <p className="hint">Create a project to organize your tasks</p>
        </div>
      ) : (
        <ul className="manageListItems">
          {projects.map((project) => (
            <li key={project._id} className="manageListItem">
              <div className="manageListItemContent">
                <span className="manageListItemName">{project.name}</span>
                {project.description && (
                  <span className="manageListItemDesc">{project.description}</span>
                )}
              </div>
              <div className="manageListItemActions">
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => handleEdit(project)}
                  title="Edit project"
                  disabled={busy}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="iconButton iconButtonDanger"
                  onClick={() => handleDelete(project)}
                  title="Delete project"
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
        isOpen={!!editingProject}
        onClose={handleCloseModal}
        title="Edit Project"
      >
        <ProjectForm
          mode="edit"
          initialProject={editingProject}
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
