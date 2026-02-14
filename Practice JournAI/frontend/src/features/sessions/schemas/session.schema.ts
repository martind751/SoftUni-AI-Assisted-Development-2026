import { z } from 'zod'

export const sessionSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  due_date: z.string(),
  description: z.string(),
  notes: z.string().nullable(),
})

export const sessionListSchema = z.array(sessionSchema)

export const createSessionInputSchema = z.object({
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().nullable().optional(),
})

export const updateSessionInputSchema = createSessionInputSchema
