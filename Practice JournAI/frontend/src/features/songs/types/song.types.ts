import type { z } from 'zod'
import type {
  songSchema,
  createSongInputSchema,
  updateSongInputSchema,
  musicBrainzResultSchema,
} from '../schemas/song.schema'

export type Song = z.infer<typeof songSchema>
export type CreateSongInput = z.infer<typeof createSongInputSchema>
export type UpdateSongInput = z.infer<typeof updateSongInputSchema>
export type MusicBrainzResult = z.infer<typeof musicBrainzResultSchema>
