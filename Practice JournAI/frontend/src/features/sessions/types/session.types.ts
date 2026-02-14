import type { z } from 'zod'
import type {
  sessionSchema,
  createSessionInputSchema,
} from '../schemas/session.schema'

export type Session = z.infer<typeof sessionSchema>
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>
export type UpdateSessionInput = CreateSessionInput
