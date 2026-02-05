import { TaskItem } from './TaskItem'

export function TaskList({ tasks, onEdit, onDelete }) {
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
    <div className="taskList">
      {tasks.map((t) => (
        <TaskItem key={t._id || t.id} task={t} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
