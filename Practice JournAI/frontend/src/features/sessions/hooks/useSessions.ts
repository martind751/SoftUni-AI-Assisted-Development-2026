import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionSchema, sessionListSchema } from '../schemas/session.schema'
import type { Session, CreateSessionInput, UpdateSessionInput } from '../types/session.types'

export const sessionKeys = {
  all: ['sessions'] as const,
  list: () => [...sessionKeys.all, 'list'] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
}

async function fetchSessions(): Promise<Session[]> {
  const response = await fetch('/api/v1/sessions')
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

async function updateSession(id: string, input: UpdateSessionInput): Promise<Session> {
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

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: fetchSessions,
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
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSessionInput }) =>
      updateSession(id, input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() })
      queryClient.setQueryData(sessionKeys.detail(data.id), data)
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() })
    },
  })
}
