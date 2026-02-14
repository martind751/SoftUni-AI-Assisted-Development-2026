import { useGenre, type ViewGenre } from '../contexts/GenreContext'

const genres: { value: ViewGenre; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'blues', label: 'Blues' },
  { value: 'rock_metal', label: 'Rock/Metal' },
]

export function GenreSwitcher() {
  const { activeGenre, setActiveGenre } = useGenre()

  return (
    <div
      className="flex gap-1 bg-muted p-1 transition-all duration-500"
      style={{ borderRadius: 'var(--genre-radius)' }}
    >
      {genres.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setActiveGenre(value)}
          className={`px-4 py-2 text-sm font-semibold transition-all duration-400 ${
            activeGenre === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          style={{
            borderRadius: 'var(--genre-radius)',
            boxShadow: activeGenre === value ? 'var(--genre-shadow-active)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
