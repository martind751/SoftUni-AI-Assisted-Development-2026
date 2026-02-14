import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/button'
import { useGenre } from '../../../contexts/GenreContext'
import type { CreateSessionInput, UpdateSessionInput, SessionStatus, Genre } from '../types/session.types'

const genreLabels = {
  jazz: 'Jazz',
  blues: 'Blues',
  rock_metal: 'Rock/Metal',
} as const

const genreOptions: { value: Genre; label: string }[] = [
  { value: 'jazz', label: 'Jazz' },
  { value: 'blues', label: 'Blues' },
  { value: 'rock_metal', label: 'Rock/Metal' },
]

interface SessionFormProps {
  defaultValues?: {
    due_date: string
    description: string
    status: SessionStatus
    duration_minutes: number | null
    energy_level: number | null
  }
  onSubmit: (data: CreateSessionInput | UpdateSessionInput) => void
  isSubmitting: boolean
  isEdit?: boolean
}

export function SessionForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEdit = false,
}: SessionFormProps) {
  const navigate = useNavigate()
  const { activeGenre } = useGenre()

  const isAllGenre = activeGenre === 'all'
  const [selectedGenre, setSelectedGenre] = useState<Genre>(
    isAllGenre ? 'jazz' : activeGenre,
  )
  const genre = isAllGenre ? selectedGenre : activeGenre

  const [dueDate, setDueDate] = useState(defaultValues?.due_date ?? '')
  const [description, setDescription] = useState(
    defaultValues?.description ?? '',
  )
  const [status, setStatus] = useState<SessionStatus>(
    defaultValues?.status ?? 'planned',
  )
  const [durationMinutes, setDurationMinutes] = useState<string>(
    defaultValues?.duration_minutes?.toString() ?? '',
  )
  const [energyLevel, setEnergyLevel] = useState<number | null>(
    defaultValues?.energy_level ?? null,
  )
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

    const parsedDuration = durationMinutes ? parseInt(durationMinutes, 10) : null
    if (durationMinutes && (isNaN(parsedDuration!) || parsedDuration! <= 0)) {
      newErrors.duration_minutes = 'Duration must be a positive number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    if (isEdit) {
      onSubmit({
        due_date: dueDate,
        description: description.trim(),
        genre,
        status,
        duration_minutes: parsedDuration,
        energy_level: energyLevel,
      } satisfies UpdateSessionInput)
    } else {
      onSubmit({
        due_date: dueDate,
        description: description.trim(),
        genre,
        duration_minutes: parsedDuration,
        energy_level: energyLevel,
      } satisfies CreateSessionInput)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAllGenre ? (
        <div>
          <label
            htmlFor="genre"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Genre
          </label>
          <select
            id="genre"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value as Genre)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {genreOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          Genre: <span className="font-medium">{genreLabels[activeGenre]}</span>
        </div>
      )}

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

      {isEdit && (
        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SessionStatus)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor="duration_minutes"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Duration (minutes)
        </label>
        <input
          id="duration_minutes"
          type="number"
          min="1"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.duration_minutes && (
          <p className="mt-1 text-sm text-destructive">
            {errors.duration_minutes}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Energy Level
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() =>
                setEnergyLevel(energyLevel === level ? null : level)
              }
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                energyLevel === level
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
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
