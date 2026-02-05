import { useEffect, useState } from 'react'
import { getStats } from '../api/stats'
import { listTasks } from '../api/tasks'
import './Dashboard.css'

export function Dashboard({ onNavigateToTasks }) {
  const [stats, setStats] = useState(null)
  const [todayTasks, setTodayTasks] = useState([])
  const [overdueTasks, setOverdueTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboardData() {
      setLoading(true)
      setError('')
      try {
        const [statsData, todayData] = await Promise.all([
          getStats(),
          listTasks({ view: 'today', sortBy: 'priority', sortOrder: 'asc' })
        ])
        
        if (!cancelled) {
          setStats(statsData)
          // Separate today and overdue from the 'today' view (which includes both)
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          
          const overdue = todayData.filter(t => {
            if (!t.dueDate) return false
            return new Date(t.dueDate) < today
          })
          
          const dueToday = todayData.filter(t => {
            if (!t.dueDate) return false
            const due = new Date(t.dueDate)
            return due >= today && due < new Date(today.getTime() + 86400000)
          })
          
          setOverdueTasks(overdue)
          setTodayTasks(dueToday)
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      cancelled = true
    }
  }, [])

  function handleViewTasks(view) {
    onNavigateToTasks?.(view)
  }

  if (loading) {
    return (
      <div className="dashboardContainer">
        <div className="loading">
          <span className="spinner"></span>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboardContainer">
        <div className="error">{error}</div>
      </div>
    )
  }

  const overview = stats?.overview || {}
  const productivity = stats?.productivity || {}

  return (
    <div className="dashboardContainer">
      <div className="dashboardHeader">
        <h2>Dashboard</h2>
        <span className="dashboardSubtitle">Your productivity at a glance</span>
      </div>

      {/* Quick Stats Cards */}
      <div className="dashboardGrid">
        <div 
          className="dashboardCard dashboardCardClickable dashboardCardDanger"
          onClick={() => handleViewTasks('today')}
          role="button"
          tabIndex={0}
        >
          <div className="dashboardCardIcon">!</div>
          <div className="dashboardCardContent">
            <div className="dashboardCardValue">{overview.overdue || 0}</div>
            <div className="dashboardCardLabel">Overdue</div>
          </div>
        </div>

        <div 
          className="dashboardCard dashboardCardClickable dashboardCardWarning"
          onClick={() => handleViewTasks('today')}
          role="button"
          tabIndex={0}
        >
          <div className="dashboardCardIcon">*</div>
          <div className="dashboardCardContent">
            <div className="dashboardCardValue">{overview.dueToday || 0}</div>
            <div className="dashboardCardLabel">Due Today</div>
          </div>
        </div>

        <div 
          className="dashboardCard dashboardCardClickable dashboardCardInfo"
          onClick={() => handleViewTasks('upcoming')}
          role="button"
          tabIndex={0}
        >
          <div className="dashboardCardIcon">#</div>
          <div className="dashboardCardContent">
            <div className="dashboardCardValue">{overview.todo + overview.inProgress || 0}</div>
            <div className="dashboardCardLabel">Active Tasks</div>
          </div>
        </div>

        <div 
          className="dashboardCard dashboardCardClickable dashboardCardSuccess"
          onClick={() => handleViewTasks('completed')}
          role="button"
          tabIndex={0}
        >
          <div className="dashboardCardIcon">✓</div>
          <div className="dashboardCardContent">
            <div className="dashboardCardValue">{overview.completed || 0}</div>
            <div className="dashboardCardLabel">Completed</div>
          </div>
        </div>
      </div>

      {/* Productivity Summary */}
      <div className="dashboardSection">
        <h3>Recent Activity</h3>
        <div className="productivitySummary">
          <div className="productivityItem">
            <span className="productivityValue">{productivity.completedLast7Days || 0}</span>
            <span className="productivityLabel">completed this week</span>
          </div>
          <div className="productivityDivider"></div>
          <div className="productivityItem">
            <span className="productivityValue">{productivity.avgTasksPerDay || 0}</span>
            <span className="productivityLabel">avg per day</span>
          </div>
          <div className="productivityDivider"></div>
          <div className="productivityItem">
            <span className="productivityValue">{overview.completionRate || 0}%</span>
            <span className="productivityLabel">completion rate</span>
          </div>
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="dashboardSection">
          <div className="dashboardSectionHeader">
            <h3>Overdue Tasks</h3>
            <button 
              className="dashboardViewAll"
              onClick={() => handleViewTasks('today')}
            >
              View all →
            </button>
          </div>
          <div className="dashboardTaskList">
            {overdueTasks.slice(0, 5).map(task => (
              <div key={task._id || task.id} className="dashboardTaskItem dashboardTaskOverdue">
                <div className="dashboardTaskTitle">{task.title}</div>
                <div className="dashboardTaskMeta">
                  {task.dueDate && (
                    <span className="dashboardTaskDue">
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}
                  {task.projectId?.name && (
                    <span className="dashboardTaskProject">{task.projectId.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Today */}
      {todayTasks.length > 0 && (
        <div className="dashboardSection">
          <div className="dashboardSectionHeader">
            <h3>Due Today</h3>
            <button 
              className="dashboardViewAll"
              onClick={() => handleViewTasks('today')}
            >
              View all →
            </button>
          </div>
          <div className="dashboardTaskList">
            {todayTasks.slice(0, 5).map(task => (
              <div key={task._id || task.id} className="dashboardTaskItem">
                <div className="dashboardTaskTitle">{task.title}</div>
                <div className="dashboardTaskMeta">
                  {task.projectId?.name && (
                    <span className="dashboardTaskProject">{task.projectId.name}</span>
                  )}
                  {task.priority && (
                    <span className={`dashboardTaskPriority priority-${task.priority}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no urgent tasks */}
      {overdueTasks.length === 0 && todayTasks.length === 0 && (
        <div className="dashboardSection">
          <div className="dashboardEmptyState">
            <div className="dashboardEmptyIcon">🎉</div>
            <p className="dashboardEmptyText">You're all caught up!</p>
            <p className="dashboardEmptyHint">No overdue or tasks due today</p>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDueDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function getPriorityLabel(priority) {
  const labels = { 1: 'High', 2: 'Medium', 3: 'Normal', 4: 'Low' }
  return labels[priority] || 'Normal'
}
