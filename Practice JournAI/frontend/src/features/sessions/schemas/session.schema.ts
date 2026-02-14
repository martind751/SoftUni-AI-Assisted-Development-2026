import { z } from 'zod'

export const genreSchema = z.enum(['jazz', 'blues', 'rock_metal'])

export const statusSchema = z.enum(['planned', 'completed', 'skipped'])

export const sessionNoteSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  created_at: z.string(),
})

export const sessionSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  due_date: z.string(),
  description: z.string(),
  duration_minutes: z.number().int().nullable(),
  energy_level: z.number().int().min(1).max(5).nullable(),
  status: statusSchema,
  genre: genreSchema,
  notes: z.array(sessionNoteSchema),
})

export const sessionListSchema = z.array(sessionSchema)

export const createSessionInputSchema = z.object({
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().min(1, 'Description is required'),
  genre: genreSchema,
  duration_minutes: z.number().int().positive().nullable().optional(),
  energy_level: z.number().int().min(1).max(5).nullable().optional(),
  status: statusSchema.optional(),
})

export const updateSessionInputSchema = z.object({
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().min(1, 'Description is required'),
  genre: genreSchema,
  status: statusSchema,
  duration_minutes: z.number().int().positive().nullable().optional(),
  energy_level: z.number().int().min(1).max(5).nullable().optional(),
})

export const createNoteInputSchema = z.object({
  content: z.string().min(1, 'Content is required'),
})
