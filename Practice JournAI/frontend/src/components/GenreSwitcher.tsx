import { useGenre } from '../contexts/GenreContext'
import type { Genre } from '../features/sessions/types/session.types'

const genres: { value: Genre; label: string }[] = [
  { value: 'jazz', label: 'Jazz' },
  { value: 'blues', label: 'Blues' },
  { value: 'rock_metal', label: 'Rock/Metal' },
]

export function GenreSwitcher() {
  const { activeGenre, setActiveGenre } = useGenre()

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {genres.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setActiveGenre(value)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGenre === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
