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
  duration_seconds: z.number().nullable(),
  album: z.string().nullable(),
  release_year: z.number().nullable(),
  musicbrainz_artist_id: z.string().nullable(),
})

export const songListSchema = z.array(songSchema)

export const createSongInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  genre: genreSchema,
  notes: z.string().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  album: z.string().nullable().optional(),
  release_year: z.number().nullable().optional(),
  musicbrainz_artist_id: z.string().nullable().optional(),
})

export const updateSongInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  genre: genreSchema,
  notes: z.string().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  album: z.string().nullable().optional(),
  release_year: z.number().nullable().optional(),
  musicbrainz_artist_id: z.string().nullable().optional(),
})

export const musicBrainzArtistResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  disambiguation: z.string(),
})
export const musicBrainzArtistResultListSchema = z.array(musicBrainzArtistResultSchema)

export const musicBrainzRecordingResultSchema = z.object({
  title: z.string(),
  artist: z.string(),
  duration_seconds: z.number().nullable(),
  album: z.string().nullable(),
  release_year: z.number().nullable(),
})
export const musicBrainzRecordingResultListSchema = z.array(musicBrainzRecordingResultSchema)
