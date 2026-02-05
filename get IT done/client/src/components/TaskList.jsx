import { useState, useRef, useEffect } from 'react'
import { TaskItem } from './TaskItem'

const VIEW_MODE_LABELS = {
  all: 'All Tasks',
  active: 'Active',
  today: 'Today',
  upcoming: 'Upcoming',
  completed: 'Completed'
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: '1', label: 'High' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Low' }
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' }
]

export function TaskList({ 
  tasks, 
  projects = [], 
  categories = [], 
  filters = {},
  onFiltersChange,
  onEdit, 
  onDelete, 
  onToggleComplete 
}) {
  const { 
    view = 'all', 
    projectId = '', 
    categoryId = '', 
    status = '', 
    priority = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters

  // Pending filter state for batch application
  const [pendingFilters, setPendingFilters] = useState({
    projectId,
    categoryId,
    status,
    priority,
    sortBy,
    sortOrder
  })

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const filterPanelRef = useRef(null)

  // Sync pending state when panel opens
  const openFilterPanel = () => {
    setPendingFilters({
      projectId,
      categoryId,
      status,
      priority,
      sortBy,
      sortOrder
    })
    setShowFilterPanel(true)
  }

  const updatePendingFilter = (key, value) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    onFiltersChange?.({ ...filters, ...pendingFilters })
    setShowFilterPanel(false)
  }

  const cancelFilters = () => {
    setShowFilterPanel(false)
  }

  const clearAllFilters = () => {
    const cleared = {
      projectId: '',
      categoryId: '',
      status: '',
      priority: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    setPendingFilters(cleared)
    onFiltersChange?.({ ...filters, ...cleared, view: 'all' })
    setShowFilterPanel(false)
  }

  // View mode changes apply immediately (not part of panel)
  const updateViewMode = (mode) => {
    onFiltersChange?.({ ...filters, view: mode })
  }

  const togglePendingSortOrder = () => {
    updatePendingFilter('sortOrder', pendingFilters.sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const hasFilters = projectId || categoryId || status || priority
  const activeFilterCount = [projectId, categoryId, status, priority].filter(Boolean).length

  // Get display names for active filters
  const getActiveFilterDisplay = () => {
    const chips = []
    
    if (projectId) {
      const project = projects.find(p => p._id === projectId)
      chips.push({ key: 'projectId', label: `Project: ${project?.name || 'Unknown'}`, value: projectId })
    }
    
    if (categoryId) {
      const category = categories.find(c => c._id === categoryId)
      chips.push({ key: 'categoryId', label: `Category: ${category?.name || 'Unknown'}`, value: categoryId })
    }
    
    if (status) {
      const statusOption = STATUS_OPTIONS.find(opt => opt.value === status)
      chips.push({ key: 'status', label: `Status: ${statusOption?.label || status}`, value: status })
    }
    
    if (priority) {
      const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === priority)
      chips.push({ key: 'priority', label: `Priority: ${priorityOption?.label || priority}`, value: priority })
    }
    
    return chips
  }

  const removeFilter = (key) => {
    onFiltersChange?.({ ...filters, [key]: '' })
  }

  const getSortDisplay = () => {
    const sortOption = SORT_OPTIONS.find(opt => opt.value === sortBy)
    const direction = sortOrder === 'asc' ? 'Ascending' : 'Descending'
    return `${sortOption?.label || sortBy} (${direction})`
  }

  const isDefaultSort = sortBy === 'createdAt' && sortOrder === 'desc'
  const activeFilters = getActiveFilterDisplay()

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setShowFilterPanel(false)
      }
    }
    if (showFilterPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilterPanel])

  if (!tasks.length && view === 'all' && !hasFilters) {
    return (
      <div className="emptyState">
        <div className="emptyIcon"></div>
        <p className="emptyText">No tasks yet</p>
        <p className="emptyHint">Create your first task to get started!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="viewModeTabs">
        {Object.entries(VIEW_MODE_LABELS).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            className={`viewModeTab ${view === mode ? 'active' : ''}`}
            onClick={() => updateViewMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="filterToolbar">
        <div className="filterDropdownContainer" ref={filterPanelRef}>
          <button
            type="button"
            className={`filterDropdownBtn ${hasFilters ? 'hasFilters' : ''}`}
            onClick={() => showFilterPanel ? setShowFilterPanel(false) : openFilterPanel()}
          >
            <span className="filterIcon">⚙</span>
            Filters & Sort
            {activeFilterCount > 0 && (
              <span className="filterBadge">{activeFilterCount}</span>
            )}
          </button>

          {showFilterPanel && (
            <div className="filterPanel">
              <div className="filterPanelSection">
                <label className="filterPanelLabel">Filter by</label>
                <div className="filterPanelGrid">
                  <select
                    value={pendingFilters.projectId}
                    onChange={(e) => updatePendingFilter('projectId', e.target.value)}
                    className="filterSelect"
                  >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={pendingFilters.categoryId}
                    onChange={(e) => updatePendingFilter('categoryId', e.target.value)}
                    className="filterSelect"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={pendingFilters.status}
                    onChange={(e) => updatePendingFilter('status', e.target.value)}
                    className="filterSelect"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select
                    value={pendingFilters.priority}
                    onChange={(e) => updatePendingFilter('priority', e.target.value)}
                    className="filterSelect"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filterPanelSection">
                <label className="filterPanelLabel">Sort by</label>
                <div className="filterPanelSortRow">
                  <select
                    value={pendingFilters.sortBy}
                    onChange={(e) => updatePendingFilter('sortBy', e.target.value)}
                    className="filterSelect"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="sortDirectionBtn"
                    onClick={togglePendingSortOrder}
                    title={pendingFilters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {pendingFilters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>
              </div>

              <div className="filterPanelActions">
                <button
                  type="button"
                  className="button buttonPrimary"
                  onClick={applyFilters}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={cancelFilters}
                >
                  Cancel
                </button>
                {(hasFilters || pendingFilters.projectId || pendingFilters.categoryId || pendingFilters.status || pendingFilters.priority) && (
                  <button
                    type="button"
                    className="button buttonSmall filterPanelClearBtn"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display - Below toolbar */}
      {(hasFilters || !isDefaultSort) && (
        <div className="activeFiltersBar">
          <span className="activeFiltersLabel">APPLIED:</span>
          
          {projectId && (
              <div className="filterChipEditable">
                <label>Project:</label>
                <select
                  value={projectId}
                  onChange={(e) => onFiltersChange?.({ ...filters, projectId: e.target.value })}
                  className="filterChipSelect"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="filterChipRemove"
                  onClick={() => removeFilter('projectId')}
                  title="Remove filter"
                >
                  ×
                </button>
              </div>
            )}

            {categoryId && (
              <div className="filterChipEditable">
                <label>Category:</label>
                <select
                  value={categoryId}
                  onChange={(e) => onFiltersChange?.({ ...filters, categoryId: e.target.value })}
                  className="filterChipSelect"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="filterChipRemove"
                  onClick={() => removeFilter('categoryId')}
                  title="Remove filter"
                >
                  ×
                </button>
              </div>
            )}

            {status && (
              <div className="filterChipEditable">
                <label>Status:</label>
                <select
                  value={status}
                  onChange={(e) => onFiltersChange?.({ ...filters, status: e.target.value })}
                  className="filterChipSelect"
                >
                  {STATUS_OPTIONS.filter(opt => opt.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="filterChipRemove"
                  onClick={() => removeFilter('status')}
                  title="Remove filter"
                >
                  ×
                </button>
              </div>
            )}

            {priority && (
              <div className="filterChipEditable">
                <label>Priority:</label>
                <select
                  value={priority}
                  onChange={(e) => onFiltersChange?.({ ...filters, priority: e.target.value })}
                  className="filterChipSelect"
                >
                  {PRIORITY_OPTIONS.filter(opt => opt.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="filterChipRemove"
                  onClick={() => removeFilter('priority')}
                  title="Remove filter"
                >
                  ×
                </button>
              </div>
            )}

            {!isDefaultSort && (
              <div className="filterChipEditable sortChip">
                <label>Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => onFiltersChange?.({ ...filters, sortBy: e.target.value })}
                  className="filterChipSelect"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="sortDirectionBtn sortDirectionInline"
                  onClick={() => onFiltersChange?.({ ...filters, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            )}

            <button
              type="button"
              className="button buttonSmall clearFiltersBtn"
              onClick={clearAllFilters}
              title="Clear all filters and reset sort"
            >
              Clear All
            </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="emptyState">
          <div className="emptyIcon"></div>
          <p className="emptyText">No matching tasks</p>
          <p className="emptyHint">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="taskList">
          {tasks.map((t) => (
            <TaskItem key={t._id || t.id} task={t} onEdit={onEdit} onDelete={onDelete} onToggleComplete={onToggleComplete} />
          ))}
        </div>
      )}
    </div>
  )
}
