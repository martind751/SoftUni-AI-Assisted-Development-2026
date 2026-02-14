import type { z } from 'zod'
import type { healthResponseSchema } from '../schemas/health.schema'

export type HealthResponse = z.infer<typeof healthResponseSchema>
