import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/button'
import type { CreateSessionInput } from '../types/session.types'

interface SessionFormProps {
  defaultValues?: {
    due_date: string
    description: string
    notes: string | null
  }
  onSubmit: (data: CreateSessionInput) => void
  isSubmitting: boolean
}

export function SessionForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: SessionFormProps) {
  const navigate = useNavigate()

  const [dueDate, setDueDate] = useState(defaultValues?.due_date ?? '')
  const [description, setDescription] = useState(
    defaultValues?.description ?? '',
  )
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!dueDate) {
      newErrors.due_date = 'Due date is required'
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    onSubmit({
      due_date: dueDate,
      description: description.trim(),
      notes: notes.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="due_date"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Due Date
        </label>
        <input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.due_date && (
          <p className="mt-1 text-sm text-destructive">{errors.due_date}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Work on Autumn Leaves comping"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this session..."
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Session'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void navigate({ to: '/sessions' })}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
