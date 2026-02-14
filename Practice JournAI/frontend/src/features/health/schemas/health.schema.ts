import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  error: z.string().optional(),
})
