import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Genre } from '../features/sessions/types/session.types'

export type ViewGenre = Genre | 'all'
export type ThemeMode = 'dark' | 'light'

interface GenreContextValue {
  activeGenre: ViewGenre
  setActiveGenre: (genre: ViewGenre) => void
  themeMode: ThemeMode
  toggleThemeMode: () => void
}

const GenreContext = createContext<GenreContextValue | undefined>(undefined)

const STORAGE_KEY = 'practice-journai-genre'
const THEME_STORAGE_KEY = 'practice-journai-theme'

function getInitialGenre(): ViewGenre {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'jazz' || stored === 'blues' || stored === 'rock_metal' || stored === 'all') {
    return stored
  }
  return 'jazz'
}

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }
  return 'dark'
}

export function GenreProvider({ children }: { children: ReactNode }) {
  const [activeGenre, setActiveGenreState] = useState<ViewGenre>(getInitialGenre)
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.genre = activeGenre
  }, [activeGenre])

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  function setActiveGenre(genre: ViewGenre) {
    setActiveGenreState(genre)
    localStorage.setItem(STORAGE_KEY, genre)
  }

  function toggleThemeMode() {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_STORAGE_KEY, next)
      return next
    })
  }

  return (
    <GenreContext.Provider value={{ activeGenre, setActiveGenre, themeMode, toggleThemeMode }}>
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
