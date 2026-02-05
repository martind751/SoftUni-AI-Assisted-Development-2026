import './App.css'

import { useEffect, useState } from 'react'

import { createTask, deleteTask, listTasks, updateTask } from './api/tasks'
import { listProjects, createProject, updateProject, deleteProject } from './api/projects'
import { listCategories, createCategory, updateCategory, deleteCategory } from './api/categories'
import { listGoals, createGoal, updateGoal, deleteGoal } from './api/goals'
import { listTags, createTag, updateTag, deleteTag } from './api/tags'
import { Modal } from './components/Modal'
import { TaskForm } from './components/TaskForm'
import { ProjectForm } from './components/ProjectForm'
import { CategoryForm } from './components/CategoryForm'
import { GoalForm } from './components/GoalForm'
import { TagForm } from './components/TagForm'
import { TaskList } from './components/TaskList'
import { Statistics } from './components/Statistics'
import { Dashboard } from './components/Dashboard'
import { Manage } from './components/Manage'

function normalizeTask(t) {
  return {
    ...t,
    _id: t._id || t.id
  }
}

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')

  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [tasksError, setTasksError] = useState('')
  const [busy, setBusy] = useState(false)

  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [goals, setGoals] = useState([])
  const [tags, setTags] = useState([])

  // Navigation state
  const [currentView, setCurrentView] = useState('overview')
  const [overviewSubView, setOverviewSubView] = useState('dashboard') // 'dashboard' or 'statistics'

  // Filter and sort state for tasks
  const [taskFilters, setTaskFilters] = useState({
    view: 'all',
    projectId: '',
    categoryId: '',
    status: '',
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const [editingTask, setEditingTask] = useState(null)
  const [activeModal, setActiveModal] = useState(null) // 'task', 'project', 'category', 'goal', 'tag'

  function openCreateTaskModal() {
    setEditingTask(null)
    setTasksError('')
    setActiveModal('task')
  }

  function openEditTaskModal(task) {
    setEditingTask(task)
    setTasksError('')
    setActiveModal('task')
  }

  function openCreateProjectModal() {
    setActiveModal('project')
  }

  function openCreateCategoryModal() {
    setActiveModal('category')
  }

  function openCreateGoalModal() {
    setActiveModal('goal')
  }

  function openCreateTagModal() {
    setActiveModal('tag')
  }

  function closeModal() {
    setActiveModal(null)
    setEditingTask(null)
    setTasksError('')
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/health')
        const json = await res.json()
        if (!cancelled) setHealth(json)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to reach server')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTasks() {
      setTasksLoading(true)
      setTasksError('')
      try {
        // Build options from taskFilters, excluding empty values and 'all' view
        const options = {}
        if (taskFilters.view && taskFilters.view !== 'all') options.view = taskFilters.view
        if (taskFilters.projectId) options.projectId = taskFilters.projectId
        if (taskFilters.categoryId) options.categoryId = taskFilters.categoryId
        if (taskFilters.status) options.status = taskFilters.status
        if (taskFilters.priority) options.priority = taskFilters.priority
        if (taskFilters.sortBy) options.sortBy = taskFilters.sortBy
        if (taskFilters.sortOrder) options.sortOrder = taskFilters.sortOrder
        
        const rows = await listTasks(options)
        if (!cancelled) setTasks(rows.map(normalizeTask))
      } catch (e) {
        if (!cancelled) setTasksError(e?.message || 'Failed to load tasks')
      } finally {
        if (!cancelled) setTasksLoading(false)
      }
    }

    loadTasks()
    return () => {
      cancelled = true
    }
  }, [taskFilters])

  useEffect(() => {
    let cancelled = false

    async function loadProjectsAndCategories() {
      try {
        const [projectsData, categoriesData, goalsData, tagsData] = await Promise.all([
          listProjects(),
          listCategories(),
          listGoals(),
          listTags()
        ])
        if (!cancelled) {
          setProjects(projectsData)
          setCategories(categoriesData)
          setGoals(goalsData)
          setTags(tagsData)
        }
      } catch (e) {
        console.error('Failed to load projects/categories/goals/tags:', e)
      }
    }

    loadProjectsAndCategories()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreateProject(payload) {
    setBusy(true)

    try {
      const created = await createProject(payload)
      setProjects((prev) => [...prev, created])
      closeModal()
      return created
    } catch (e) {
      setTasksError(e?.message || 'Failed to create project')
      throw e
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateCategory(payload) {
    setBusy(true)

    try {
      const created = await createCategory(payload)
      setCategories((prev) => [...prev, created])
      closeModal()
      return created
    } catch (e) {
      setTasksError(e?.message || 'Failed to create category')
      throw e
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateProject(id, payload) {
    setBusy(true)
    try {
      const updated = await updateProject(id, payload)
      setProjects((prev) => prev.map((p) => (p._id === id ? updated : p)))
      return updated
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteProject(id) {
    setBusy(true)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p._id !== id))
      // Refetch tasks to update any that had this project
      const options = {}
      if (taskFilters.view && taskFilters.view !== 'all') options.view = taskFilters.view
      const rows = await listTasks(options)
      setTasks(rows.map(normalizeTask))
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateCategory(id, payload) {
    setBusy(true)
    try {
      const updated = await updateCategory(id, payload)
      setCategories((prev) => prev.map((c) => (c._id === id ? updated : c)))
      return updated
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteCategory(id) {
    setBusy(true)
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c._id !== id))
      // Refetch tasks to update any that had this category
      const options = {}
      if (taskFilters.view && taskFilters.view !== 'all') options.view = taskFilters.view
      const rows = await listTasks(options)
      setTasks(rows.map(normalizeTask))
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateGoal(payload) {
    setBusy(true)
    try {
      const created = await createGoal(payload)
      setGoals((prev) => [...prev, created])
      closeModal()
      return created
    } catch (e) {
      setTasksError(e?.message || 'Failed to create goal')
      throw e
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateGoal(id, payload) {
    setBusy(true)
    try {
      const updated = await updateGoal(id, payload)
      setGoals((prev) => prev.map((g) => (g._id === id ? updated : g)))
      return updated
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteGoal(id) {
    setBusy(true)
    try {
      await deleteGoal(id)
      setGoals((prev) => prev.filter((g) => g._id !== id))
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateTag(payload) {
    setBusy(true)
    try {
      const created = await createTag(payload)
      setTags((prev) => [...prev, created])
      closeModal()
      return created
    } catch (e) {
      setTasksError(e?.message || 'Failed to create tag')
      throw e
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateTag(id, payload) {
    setBusy(true)
    try {
      const updated = await updateTag(id, payload)
      setTags((prev) => prev.map((t) => (t._id === id ? updated : t)))
      return updated
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteTag(id) {
    setBusy(true)
    try {
      await deleteTag(id)
      setTags((prev) => prev.filter((t) => t._id !== id))
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(payload) {
    setBusy(true)
    setTasksError('')

    const tmpId = `tmp-${Date.now()}`
    const optimistic = normalizeTask({
      _id: tmpId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    setTasks((prev) => [optimistic, ...prev])

    try {
      const created = await createTask(payload)
      setTasks((prev) => prev.map((t) => (t._id === tmpId ? normalizeTask(created) : t)))
      closeModal()
    } catch (e) {
      setTasks((prev) => prev.filter((t) => t._id !== tmpId))
      setTasksError(e?.message || 'Failed to create task')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave(payload) {
    if (!editingTask?._id) return

    setBusy(true)
    setTasksError('')

    const id = editingTask._id
    const previous = tasks

    setTasks((prev) => prev.map((t) => (t._id === id ? normalizeTask({ ...t, ...payload }) : t)))

    try {
      const updated = await updateTask(id, payload)
      setTasks((prev) => prev.map((t) => (t._id === id ? normalizeTask(updated) : t)))
      closeModal()
    } catch (e) {
      setTasks(previous)
      setTasksError(e?.message || 'Failed to update task')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleComplete(task) {
    const id = task?._id
    if (!id) return

    const newStatus = task.status === 'done' ? 'todo' : 'done'
    const previous = tasks

    // Optimistically update UI
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t)))

    try {
      await updateTask(id, { status: newStatus })
    } catch (e) {
      // Revert on error
      setTasks(previous)
      setTasksError(e?.message || 'Failed to update task')
    }
  }

  async function handleDelete(task) {
    const id = task?._id
    if (!id) return

    const ok = window.confirm(`Delete "${task.title || 'this task'}"?`)
    if (!ok) return

    setBusy(true)
    setTasksError('')

    const previous = tasks
    setTasks((prev) => prev.filter((t) => t._id !== id))

    try {
      await deleteTask(id)
      if (editingTask?._id === id) setEditingTask(null)
    } catch (e) {
      setTasks(previous)
      setTasksError(e?.message || 'Failed to delete task')
    } finally {
      setBusy(false)
    }
  }

  const serverOnline = Boolean(health) && !error

  const statusBadgeClass = error ? 'statusBadge offline' : health ? 'statusBadge online' : 'statusBadge checking'
  const statusText = error ? 'Offline' : health ? 'Online' : 'Connecting...'

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="headerLeft">
          <h1>get IT done</h1>
          <span className="subtitle">Your personal productivity hub</span>
        </div>
        <div className="headerRight">
          <div className={statusBadgeClass}>
            <span className="statusDot"></span>
            {statusText}
          </div>
        </div>
      </header>

      <Modal 
        isOpen={activeModal === 'task'} 
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          mode={editingTask ? 'edit' : 'create'}
          initialTask={editingTask}
          busy={busy}
          error={tasksError}
          projects={projects}
          categories={categories}
          goals={goals}
          tags={tags}
          onSubmit={editingTask ? handleSave : handleCreate}
          onCancel={closeModal}
          hideHeader
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'project'} 
        onClose={closeModal}
        title='New Project'
      >
        <ProjectForm
          mode='create'
          busy={busy}
          error={tasksError}
          onSubmit={handleCreateProject}
          onCancel={closeModal}
          hideHeader
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'category'} 
        onClose={closeModal}
        title='New Category'
      >
        <CategoryForm
          mode='create'
          busy={busy}
          error={tasksError}
          onSubmit={handleCreateCategory}
          onCancel={closeModal}
          hideHeader
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'goal'} 
        onClose={closeModal}
        title='New Goal'
      >
        <GoalForm
          mode='create'
          busy={busy}
          error={tasksError}
          onSubmit={handleCreateGoal}
          onCancel={closeModal}
          hideHeader
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'tag'} 
        onClose={closeModal}
        title='New Tag'
      >
        <TagForm
          mode='create'
          busy={busy}
          error={tasksError}
          onSubmit={handleCreateTag}
          onCancel={closeModal}
          hideHeader
        />
      </Modal>

      <nav className="appNav">
        <button 
          className={`navTab ${currentView === 'overview' ? 'navTabActive' : ''}`}
          onClick={() => setCurrentView('overview')}
        >
          Overview
        </button>
        <button 
          className={`navTab ${currentView === 'tasks' ? 'navTabActive' : ''}`}
          onClick={() => setCurrentView('tasks')}
        >
          Tasks
        </button>
        <button 
          className={`navTab ${currentView === 'manage' ? 'navTabActive' : ''}`}
          onClick={() => setCurrentView('manage')}
        >
          Manage
        </button>
      </nav>

      <main className="boardLayout">
        {currentView === 'overview' ? (
          <section className="boardCard">
            <div className="overviewToggle">
              <button
                className={`overviewToggleBtn ${overviewSubView === 'dashboard' ? 'overviewToggleBtnActive' : ''}`}
                onClick={() => setOverviewSubView('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`overviewToggleBtn ${overviewSubView === 'statistics' ? 'overviewToggleBtnActive' : ''}`}
                onClick={() => setOverviewSubView('statistics')}
              >
                Statistics
              </button>
            </div>
            {overviewSubView === 'dashboard' ? (
              <Dashboard 
                onNavigateToTasks={(view) => {
                  setTaskFilters(prev => ({ ...prev, view: view || 'all' }))
                  setCurrentView('tasks')
                }}
              />
            ) : (
              <Statistics />
            )}
          </section>
        ) : currentView === 'tasks' ? (
          <section className="boardCard">
            <div className="taskListHeader">
              <h2>Tasks</h2>
              <div className="createActions">
                <div className="createDropdown">
                  <button 
                    type="button" 
                    className="button buttonPrimary createNewButton"
                  >
                    + Create New
                    <span className="dropdownArrow">▼</span>
                  </button>
                  <div className="dropdownMenu">
                    <button 
                      type="button" 
                      className="dropdownItem" 
                      onClick={openCreateTaskModal}
                    >
                      New Task
                    </button>
                    <button 
                      type="button" 
                      className="dropdownItem" 
                      onClick={openCreateProjectModal}
                    >
                      New Project
                    </button>
                    <button 
                      type="button" 
                      className="dropdownItem" 
                      onClick={openCreateCategoryModal}
                    >
                      New Category
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {!serverOnline ? (
              <div className="emptyState">
                <div className="emptyIcon"></div>
                <p className="emptyText">Server offline</p>
                <p className="emptyHint">Start the server to load your tasks</p>
              </div>
            ) : tasksLoading ? (
              <div className="loading">
                <span className="spinner"></span>
                Loading your tasks...
              </div>
            ) : (
              <TaskList 
                tasks={tasks} 
                projects={projects}
                categories={categories}
                filters={taskFilters}
                onFiltersChange={setTaskFilters}
                onEdit={openEditTaskModal} 
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            )}  

            <button
              type="button"
              className="taskFab"
              onClick={openCreateTaskModal}
              title="Create new task"
              aria-label="Create new task"
            >
              +
            </button>
          </section>
        ) : currentView === 'manage' ? (
          <section className="boardCard">
            <Manage
              projects={projects}
              categories={categories}
              goals={goals}
              tags={tags}
              busy={busy}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onCreateProject={openCreateProjectModal}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onCreateCategory={openCreateCategoryModal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onCreateGoal={openCreateGoalModal}
              onUpdateTag={handleUpdateTag}
              onDeleteTag={handleDeleteTag}
              onCreateTag={openCreateTagModal}
            />
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default App
