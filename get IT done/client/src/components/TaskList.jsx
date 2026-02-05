import { useState, useMemo } from 'react'
import { TaskItem } from './TaskItem'

export function TaskList({ tasks, projects = [], categories = [], onEdit, onDelete }) {
  const [filterProject, setFilterProject] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterProject && (t.projectId?._id || t.projectId) !== filterProject) return false
      if (filterCategory && (t.categoryId?._id || t.categoryId) !== filterCategory) return false
      return true
    })
  }, [tasks, filterProject, filterCategory])

  const hasFilters = filterProject || filterCategory

  if (!tasks.length) {
    return (
      <div className="emptyState">
        <div className="emptyIcon">📝</div>
        <p className="emptyText">No tasks yet</p>
        <p className="emptyHint">Create your first task to get started!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="filterRow">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="filterSelect"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filterSelect"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            className="button buttonSmall"
            onClick={() => { setFilterProject(''); setFilterCategory('') }}
          >
            Clear
          </button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="emptyState">
          <div className="emptyIcon">🔍</div>
          <p className="emptyText">No matching tasks</p>
          <p className="emptyHint">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="taskList">
          {filteredTasks.map((t) => (
            <TaskItem key={t._id || t.id} task={t} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
