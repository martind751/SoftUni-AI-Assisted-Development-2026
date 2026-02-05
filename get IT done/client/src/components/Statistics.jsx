import { useEffect, useState } from 'react'
import { getStats } from '../api/stats'
import './Statistics.css'

export function Statistics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      setLoading(true)
      setError('')
      try {
        const data = await getStats()
        if (!cancelled) setStats(data)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load statistics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="statisticsContainer">
        <div className="loading">
          <span className="spinner"></span>
          Loading statistics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="statisticsContainer">
        <div className="error">{error}</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="statisticsContainer">
        <div className="emptyState">
          <p>No statistics available</p>
        </div>
      </div>
    )
  }

  const { overview, productivity, distribution, trend } = stats

  // Calculate max value for trend chart
  const maxTrendValue = Math.max(...trend.map(d => d.count), 1)

  return (
    <div className="statisticsContainer">
      <div className="statisticsHeader">
        <h2>📊 Productivity Statistics</h2>
        <p className="statisticsSubtitle">Track your progress and analyze your productivity patterns</p>
      </div>

      {/* Overview Cards */}
      <div className="statsGrid">
        <div className="statCard statCardPrimary">
          <div className="statLabel">Total Tasks</div>
          <div className="statValue">{overview.total}</div>
        </div>
        
        <div className="statCard statCardSuccess">
          <div className="statLabel">Completed</div>
          <div className="statValue">{overview.completed}</div>
          <div className="statProgress">
            <div 
              className="statProgressBar statProgressBarSuccess" 
              style={{ width: `${overview.completionRate}%` }}
            ></div>
          </div>
          <div className="statHint">{overview.completionRate}% completion rate</div>
        </div>
        
        <div className="statCard statCardWarning">
          <div className="statLabel">In Progress</div>
          <div className="statValue">{overview.inProgress}</div>
        </div>
        
        <div className="statCard statCardInfo">
          <div className="statLabel">To Do</div>
          <div className="statValue">{overview.todo}</div>
        </div>
      </div>

      {/* Alerts */}
      {(overview.overdue > 0 || overview.dueToday > 0) && (
        <div className="statsAlerts">
          {overview.overdue > 0 && (
            <div className="alert alertDanger">
              <strong>⚠️ {overview.overdue}</strong> overdue task{overview.overdue !== 1 ? 's' : ''}
            </div>
          )}
          {overview.dueToday > 0 && (
            <div className="alert alertWarning">
              <strong>📅 {overview.dueToday}</strong> task{overview.dueToday !== 1 ? 's' : ''} due today
            </div>
          )}
        </div>
      )}

      {/* Productivity Metrics */}
      <div className="statsSection">
        <h3>Recent Productivity</h3>
        <div className="statsGrid statsGrid3">
          <div className="statCard">
            <div className="statLabel">Last 7 Days</div>
            <div className="statValue statValueMedium">{productivity.completedLast7Days}</div>
            <div className="statHint">tasks completed</div>
          </div>
          
          <div className="statCard">
            <div className="statLabel">Last 30 Days</div>
            <div className="statValue statValueMedium">{productivity.completedLast30Days}</div>
            <div className="statHint">tasks completed</div>
          </div>
          
          <div className="statCard">
            <div className="statLabel">Daily Average</div>
            <div className="statValue statValueMedium">{productivity.avgTasksPerDay}</div>
            <div className="statHint">tasks per day (7-day avg)</div>
          </div>
        </div>
      </div>

      {/* Completion Trend */}
      <div className="statsSection">
        <h3>Completion Trend (Last 7 Days)</h3>
        <div className="chartContainer">
          <div className="barChart">
            {trend.map((day, index) => {
              const date = new Date(day.date)
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const height = maxTrendValue > 0 ? (day.count / maxTrendValue) * 100 : 0
              
              return (
                <div key={index} className="barChartItem">
                  <div className="barChartBarContainer">
                    <div 
                      className="barChartBar" 
                      style={{ height: `${height}%` }}
                      title={`${day.count} tasks completed`}
                    >
                      {day.count > 0 && <span className="barChartValue">{day.count}</span>}
                    </div>
                  </div>
                  <div className="barChartLabel">{dayName}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Distribution by Priority */}
      <div className="statsSection">
        <h3>Tasks by Priority</h3>
        <div className="distributionList">
          <div className="distributionItem">
            <div className="distributionLabel">
              <span className="priorityBadge priorityCritical">Critical</span>
            </div>
            <div className="distributionBar">
              <div 
                className="distributionBarFill distributionBarCritical" 
                style={{ width: `${(distribution.byPriority.critical / overview.total * 100) || 0}%` }}
              ></div>
            </div>
            <div className="distributionValue">{distribution.byPriority.critical}</div>
          </div>
          
          <div className="distributionItem">
            <div className="distributionLabel">
              <span className="priorityBadge priorityHigh">High</span>
            </div>
            <div className="distributionBar">
              <div 
                className="distributionBarFill distributionBarHigh" 
                style={{ width: `${(distribution.byPriority.high / overview.total * 100) || 0}%` }}
              ></div>
            </div>
            <div className="distributionValue">{distribution.byPriority.high}</div>
          </div>
          
          <div className="distributionItem">
            <div className="distributionLabel">
              <span className="priorityBadge priorityMedium">Medium</span>
            </div>
            <div className="distributionBar">
              <div 
                className="distributionBarFill distributionBarMedium" 
                style={{ width: `${(distribution.byPriority.medium / overview.total * 100) || 0}%` }}
              ></div>
            </div>
            <div className="distributionValue">{distribution.byPriority.medium}</div>
          </div>
          
          <div className="distributionItem">
            <div className="distributionLabel">
              <span className="priorityBadge priorityLow">Low</span>
            </div>
            <div className="distributionBar">
              <div 
                className="distributionBarFill distributionBarLow" 
                style={{ width: `${(distribution.byPriority.low / overview.total * 100) || 0}%` }}
              ></div>
            </div>
            <div className="distributionValue">{distribution.byPriority.low}</div>
          </div>
        </div>
      </div>

      {/* Distribution by Category */}
      <div className="statsSection">
        <h3>Tasks by Category</h3>
        <div className="distributionList">
          {Object.entries(distribution.byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => (
              <div key={category} className="distributionItem">
                <div className="distributionLabel">{category}</div>
                <div className="distributionBar">
                  <div 
                    className="distributionBarFill distributionBarCategory" 
                    style={{ width: `${(count / overview.total * 100) || 0}%` }}
                  ></div>
                </div>
                <div className="distributionValue">{count}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Distribution by Project */}
      <div className="statsSection">
        <h3>Tasks by Project</h3>
        <div className="distributionList">
          {Object.entries(distribution.byProject)
            .sort((a, b) => b[1] - a[1])
            .map(([project, count]) => (
              <div key={project} className="distributionItem">
                <div className="distributionLabel">{project}</div>
                <div className="distributionBar">
                  <div 
                    className="distributionBarFill distributionBarProject" 
                    style={{ width: `${(count / overview.total * 100) || 0}%` }}
                  ></div>
                </div>
                <div className="distributionValue">{count}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
