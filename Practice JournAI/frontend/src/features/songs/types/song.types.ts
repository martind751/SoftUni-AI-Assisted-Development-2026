import type { z } from 'zod'
import type {
  songSchema,
  createSongInputSchema,
  updateSongInputSchema,
  musicBrainzArtistResultSchema,
  musicBrainzRecordingResultSchema,
} from '../schemas/song.schema'

export type Song = z.infer<typeof songSchema>
export type CreateSongInput = z.infer<typeof createSongInputSchema>
export type UpdateSongInput = z.infer<typeof updateSongInputSchema>
export type MusicBrainzArtistResult = z.infer<typeof musicBrainzArtistResultSchema>
export type MusicBrainzRecordingResult = z.infer<typeof musicBrainzRecordingResultSchema>
