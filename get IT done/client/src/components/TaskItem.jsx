function formatDueDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const isToday = d.toDateString() === today.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const isPast = d < today && !isToday
  
  if (isToday) return 'Today'
  if (isTomorrow) return 'Tomorrow'
  if (isPast) return 'Overdue'
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusLabel(status) {
  if (status === 'in_progress') return '🚀 In Progress'
  if (status === 'done') return '✅ Done'
  return '📋 To Do'
}

function statusClass(status) {
  if (status === 'in_progress') return 'pill pillProgress'
  if (status === 'done') return 'pill pillDone'
  return 'pill pillTodo'
}

function priorityLabel(priority) {
  const p = priority ?? 2
  if (p <= 1) return '🔴 High'
  if (p >= 4) return '⚪ Low'
  if (p === 2) return '🟡 Medium'
  return '🟢 Normal'
}

function priorityClass(priority) {
  const p = priority ?? 2
  if (p <= 1) return 'pill pillPriorityHigh'
  if (p >= 4) return 'pill pillPriorityLow'
  return 'pill'
}

function getDuePillClass(value) {
  if (!value) return 'pill pillDue'
  const d = new Date(value)
  const today = new Date()
  const isPast = d < today && d.toDateString() !== today.toDateString()
  const isToday = d.toDateString() === today.toDateString()
  
  if (isPast) return 'pill pillPriorityHigh'
  if (isToday) return 'pill pillProgress'
  return 'pill pillDue'
}

export function TaskItem({ task, onEdit, onDelete }) {
  const isDone = task.status === 'done'
  const isHighPriority = (task.priority ?? 2) <= 1
  
  const itemClasses = [
    'taskItem',
    isDone ? 'done' : '',
    isHighPriority && !isDone ? 'highPriority' : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={itemClasses}>
      <div className="taskContent">
        <div className="taskTitleRow">
          <strong className="taskTitle">{task.title}</strong>
        </div>
        
        <div className="pillRow">
          <span className={statusClass(task.status)}>{statusLabel(task.status)}</span>
          <span className={priorityClass(task.priority)}>{priorityLabel(task.priority)}</span>
          {task.dueDate ? (
            <span className={getDuePillClass(task.dueDate)}>
              📅 {formatDueDate(task.dueDate)}
            </span>
          ) : null}
        </div>

        {task.description ? <div className="taskDesc">{task.description}</div> : null}
      </div>

      <div className="taskButtons">
        <button type="button" className="button buttonIcon" onClick={() => onEdit(task)} title="Edit task">
          ✏️
        </button>
        <button type="button" className="button buttonIcon buttonDanger" onClick={() => onDelete(task)} title="Delete task">
          🗑️
        </button>
      </div>
    </div>
  )
}
