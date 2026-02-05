import './App.css'

import { useEffect, useState } from 'react'

import { createTask, deleteTask, listTasks, updateTask } from './api/tasks'
import { listProjects, createProject } from './api/projects'
import { listCategories, createCategory } from './api/categories'
import { Modal } from './components/Modal'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'

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

  const [editingTask, setEditingTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openCreateModal() {
    setEditingTask(null)
    setTasksError('')
    setIsModalOpen(true)
  }

  function openEditModal(task) {
    setEditingTask(task)
    setTasksError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
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
        const rows = await listTasks()
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
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProjectsAndCategories() {
      try {
        const [projectsData, categoriesData] = await Promise.all([
          listProjects(),
          listCategories()
        ])
        if (!cancelled) {
          setProjects(projectsData)
          setCategories(categoriesData)
        }
      } catch (e) {
        console.error('Failed to load projects/categories:', e)
      }
    }

    loadProjectsAndCategories()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreateProject(name) {
    try {
      const created = await createProject({ name })
      setProjects((prev) => [...prev, created])
      return created
    } catch (e) {
      console.error('Failed to create project:', e)
      throw e
    }
  }

  async function handleCreateCategory(name, color) {
    try {
      const created = await createCategory({ name, color })
      setCategories((prev) => [...prev, created])
      return created
    } catch (e) {
      console.error('Failed to create category:', e)
      throw e
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
          <button 
            type="button" 
            className="button buttonPrimary buttonLarge" 
            onClick={openCreateModal}
          >
            + New Task
          </button>
          <div className={statusBadgeClass}>
            <span className="statusDot"></span>
            {statusText}
          </div>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editingTask ? '✏️ Edit Task' : '✨ New Task'}
      >
        <TaskForm
          mode={editingTask ? 'edit' : 'create'}
          initialTask={editingTask}
          busy={busy}
          error={tasksError}
          projects={projects}
          categories={categories}
          onCreateProject={handleCreateProject}
          onCreateCategory={handleCreateCategory}
          onSubmit={editingTask ? handleSave : handleCreate}
          onCancel={closeModal}
          hideHeader
        />
      </Modal>

      <main className="boardLayout">
        <section className="boardCard">
          <div className="taskListHeader">
            <h2 className="cardTitle">📋 Your Tasks</h2>
            <span className="taskCount">
              {tasksLoading ? (
                <>
                  <span className="spinner"></span>
                  Loading...
                </>
              ) : (
                <>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</>
              )}
            </span>
          </div>

          {!serverOnline ? (
            <div className="emptyState">
              <div className="emptyIcon">🔌</div>
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
              onEdit={openEditModal} 
              onDelete={handleDelete} 
            />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
