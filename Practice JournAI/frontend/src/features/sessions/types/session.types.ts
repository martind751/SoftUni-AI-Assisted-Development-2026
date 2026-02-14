import type { z } from 'zod'
import type {
  sessionSchema,
  sessionNoteSchema,
  genreSchema,
  statusSchema,
  createSessionInputSchema,
  updateSessionInputSchema,
  createNoteInputSchema,
} from '../schemas/session.schema'

export type Session = z.infer<typeof sessionSchema>
export type SessionNote = z.infer<typeof sessionNoteSchema>
export type Genre = z.infer<typeof genreSchema>
export type SessionStatus = z.infer<typeof statusSchema>
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionInputSchema>
export type CreateNoteInput = z.infer<typeof createNoteInputSchema>
