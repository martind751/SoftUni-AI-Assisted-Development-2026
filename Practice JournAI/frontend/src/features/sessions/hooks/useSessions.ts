import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  sessionSchema,
  sessionListSchema,
  sessionNoteSchema,
} from '../schemas/session.schema'
import type {
  Session,
  SessionNote,
  Genre,
  SessionStatus,
  CreateSessionInput,
  UpdateSessionInput,
  CreateNoteInput,
} from '../types/session.types'

interface SessionFilters {
  genre?: Genre
  status?: SessionStatus
}

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (filters?: SessionFilters) =>
    [...sessionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
}

async function fetchSessions(filters?: SessionFilters): Promise<Session[]> {
  const params = new URLSearchParams()
  if (filters?.genre) params.append('genre', filters.genre)
  if (filters?.status) params.append('status', filters.status)

  const qs = params.toString()
  const url = `/api/v1/sessions${qs ? `?${qs}` : ''}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return sessionListSchema.parse(data)
}

async function fetchSession(id: string): Promise<Session> {
  const response = await fetch(`/api/v1/sessions/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return sessionSchema.parse(data)
}

async function createSession(input: CreateSessionInput): Promise<Session> {
  const response = await fetch('/api/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return sessionSchema.parse(data)
}

async function updateSession(
  id: string,
  input: UpdateSessionInput,
): Promise<Session> {
  const response = await fetch(`/api/v1/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to update session: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return sessionSchema.parse(data)
}

async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`/api/v1/sessions/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`)
  }
}

async function createNote(
  sessionId: string,
  input: CreateNoteInput,
): Promise<SessionNote> {
  const response = await fetch(`/api/v1/sessions/${sessionId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to create note: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return sessionNoteSchema.parse(data)
}

async function deleteNote(
  sessionId: string,
  noteId: string,
): Promise<void> {
  const response = await fetch(
    `/api/v1/sessions/${sessionId}/notes/${noteId}`,
    { method: 'DELETE' },
  )
  if (!response.ok) {
    throw new Error(`Failed to delete note: ${response.statusText}`)
  }
}

export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: sessionKeys.list(filters),
    queryFn: () => fetchSessions(filters),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => fetchSession(id),
    enabled: !!id,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSessionInput) => createSession(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSessionInput }) =>
      updateSession(id, input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      queryClient.setQueryData(sessionKeys.detail(data.id), data)
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    },
  })
}

export function useCreateNote(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      })
    },
  })
}

export function useDeleteNote(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(sessionId, noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      })
    },
  })
}
