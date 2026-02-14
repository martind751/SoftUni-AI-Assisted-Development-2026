import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Genre } from '../features/sessions/types/session.types'

interface GenreContextValue {
  activeGenre: Genre
  setActiveGenre: (genre: Genre) => void
}

const GenreContext = createContext<GenreContextValue | undefined>(undefined)

const STORAGE_KEY = 'practice-journai-genre'

function getInitialGenre(): Genre {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'jazz' || stored === 'blues' || stored === 'rock_metal') {
    return stored
  }
  return 'jazz'
}

export function GenreProvider({ children }: { children: ReactNode }) {
  const [activeGenre, setActiveGenreState] = useState<Genre>(getInitialGenre)

  function setActiveGenre(genre: Genre) {
    setActiveGenreState(genre)
    localStorage.setItem(STORAGE_KEY, genre)
  }

  return (
    <GenreContext.Provider value={{ activeGenre, setActiveGenre }}>
      {children}
    </GenreContext.Provider>
  )
}

export function useGenre() {
  const context = useContext(GenreContext)
  if (context === undefined) {
    throw new Error('useGenre must be used within a GenreProvider')
  }
  return context
}
