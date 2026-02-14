import { useQuery } from '@tanstack/react-query'
import { healthResponseSchema } from '../schemas/health.schema'
import type { HealthResponse } from '../types/health.types'

export const healthKeys = {
  all: ['health'] as const,
  check: () => [...healthKeys.all, 'check'] as const,
}

async function fetchHealthCheck(): Promise<HealthResponse> {
  const response = await fetch('/api/v1/health')
  const data: unknown = await response.json()
  return healthResponseSchema.parse(data)
}

export function useHealthCheck() {
  return useQuery({
    queryKey: healthKeys.check(),
    queryFn: fetchHealthCheck,
    refetchInterval: 30_000,
    retry: 1,
  })
}
