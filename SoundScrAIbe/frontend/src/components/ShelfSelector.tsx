import type { ReactNode } from 'react'

interface ShelfSelectorProps {
  value: string | null
  onChange: (status: string | null) => void
}

const SHELF_OPTIONS: { key: string; label: string; icon: ReactNode }[] = [
  {
    key: 'on_rotation',
    label: 'On Rotation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    key: 'want_to_listen',
    label: 'Want to Listen',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
  },
]

export default function ShelfSelector({ value, onChange }: ShelfSelectorProps) {
  return (
    <div>
      <p className="text-sm text-slate-400 mb-2">Collection</p>
      <div className="flex flex-wrap gap-2">
        {SHELF_OPTIONS.map(({ key, label, icon }) => {
          const isSelected = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(isSelected ? null : key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
                isSelected
                  ? 'bg-indigo-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              aria-label={isSelected ? `Remove from ${label}` : `Add to ${label}`}
            >
              {icon}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
