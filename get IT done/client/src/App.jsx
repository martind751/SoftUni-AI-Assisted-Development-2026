import './App.css'

import { useEffect, useState } from 'react'

import { createTask, deleteTask, listTasks, updateTask } from './api/tasks'
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

  const [editingTask, setEditingTask] = useState(null)

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
      setEditingTask(null)
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
        <div className={statusBadgeClass}>
          <span className="statusDot"></span>
          {statusText}
        </div>
      </header>

      <main className="layout">
        <section className="card">
          <TaskForm
            mode={editingTask ? 'edit' : 'create'}
            initialTask={editingTask}
            busy={busy}
            error={tasksError}
            onSubmit={editingTask ? handleSave : handleCreate}
            onCancel={() => setEditingTask(null)}
          />
        </section>

        <section className="card">
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
            <TaskList tasks={tasks} onEdit={setEditingTask} onDelete={handleDelete} />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
