import type { ReactNode } from 'react'

interface ShelfSelectorProps {
  value: string | null
  onChange: (status: string | null) => void
}

const SHELF_OPTIONS: { key: string; label: string; icon: ReactNode }[] = [
  {
    key: 'listened',
    label: 'Listened',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'currently_listening',
    label: 'Listening',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
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
      <p className="text-sm text-gray-400 mb-2">Shelf</p>
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
                  ? 'bg-green-500 text-black font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
