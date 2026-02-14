import { z } from 'zod'
import { genreSchema } from '../../sessions/schemas/session.schema'

export const songSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  title: z.string(),
  artist: z.string(),
  genre: genreSchema,
  notes: z.string().nullable(),
})

export const songListSchema = z.array(songSchema)

export const createSongInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  genre: genreSchema,
  notes: z.string().nullable().optional(),
})

export const updateSongInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  genre: genreSchema,
  notes: z.string().nullable().optional(),
})

export const musicBrainzResultSchema = z.object({
  title: z.string(),
  artist: z.string(),
})

export const musicBrainzResultListSchema = z.array(musicBrainzResultSchema)
