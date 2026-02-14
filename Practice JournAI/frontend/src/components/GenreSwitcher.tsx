import { useGenre } from '../contexts/GenreContext'
import type { Genre } from '../features/sessions/types/session.types'

function SaxophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2c0 0-2 2-2 4s1 3 1 5-2 4-2 4" />
      <path d="M11 15c0 2.5-2 4.5-4.5 4.5S2 17.5 2 15s2-4.5 4.5-4.5" />
      <circle cx="6.5" cy="15" r="2.5" />
      <path d="M13 5l5-2" />
      <path d="M14 8l4-1.5" />
      <path d="M15 11l3-1" />
    </svg>
  )
}

function GuitarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 2l-2.5 2.5" />
      <path d="M17.5 4.5l-3 3" />
      <path d="M14.5 7.5c1 1 1 2.5 0 3.5l-1 1c-1.5 1.5-4 2-6 1.5-1.5-.5-3 .5-3.5 1.5-.5 1-.5 2.5.5 3.5s2.5 1 3.5.5c1-.5 2-2 1.5-3.5-.5-2 0-4.5 1.5-6l1-1c1-1 2.5-1 3.5 0z" />
      <circle cx="8.5" cy="15.5" r="1" />
    </svg>
  )
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  )
}

const genres: { value: Genre; label: string; icon: typeof SaxophoneIcon }[] = [
  { value: 'jazz', label: 'Jazz', icon: SaxophoneIcon },
  { value: 'blues', label: 'Blues', icon: GuitarIcon },
  { value: 'rock_metal', label: 'Rock/Metal', icon: LightningIcon },
]

export function GenreSwitcher() {
  const { activeGenre, setActiveGenre } = useGenre()

  return (
    <div
      className="flex gap-1 bg-muted p-1 transition-all duration-500"
      style={{ borderRadius: 'var(--genre-radius)' }}
    >
      {genres.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setActiveGenre(value)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-400 ${
            activeGenre === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          style={{
            borderRadius: 'var(--genre-radius)',
            boxShadow: activeGenre === value ? 'var(--genre-shadow-active)' : 'none',
          }}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </div>
  )
}
