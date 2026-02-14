import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  songSchema,
  songListSchema,
  musicBrainzResultListSchema,
} from '../schemas/song.schema'
import type {
  Song,
  CreateSongInput,
  UpdateSongInput,
  MusicBrainzResult,
} from '../types/song.types'
import type { Genre } from '../../sessions/types/session.types'

export type SongOrderByField = 'title' | 'artist' | 'created_at'
export type OrderDir = 'asc' | 'desc'

export interface SongFilters {
  genre?: Genre
  orderBy?: SongOrderByField
  orderDir?: OrderDir
}

export const songKeys = {
  all: ['songs'] as const,
  list: (filters?: SongFilters) =>
    [...songKeys.all, 'list', filters] as const,
  detail: (id: string) => [...songKeys.all, 'detail', id] as const,
  musicBrainzSearch: (query: string) =>
    [...songKeys.all, 'musicbrainz', query] as const,
}

async function fetchSongs(filters?: SongFilters): Promise<Song[]> {
  const params = new URLSearchParams()
  if (filters?.genre) params.append('genre', filters.genre)
  if (filters?.orderBy) params.append('order_by', filters.orderBy)
  if (filters?.orderDir) params.append('order_dir', filters.orderDir)

  const qs = params.toString()
  const url = `/api/v1/songs${qs ? `?${qs}` : ''}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch songs: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return songListSchema.parse(data)
}

async function fetchSong(id: string): Promise<Song> {
  const response = await fetch(`/api/v1/songs/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch song: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return songSchema.parse(data)
}

async function createSong(input: CreateSongInput): Promise<Song> {
  const response = await fetch('/api/v1/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to create song: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return songSchema.parse(data)
}

async function updateSong(
  id: string,
  input: UpdateSongInput,
): Promise<Song> {
  const response = await fetch(`/api/v1/songs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to update song: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return songSchema.parse(data)
}

async function deleteSong(id: string): Promise<void> {
  const response = await fetch(`/api/v1/songs/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete song: ${response.statusText}`)
  }
}

async function searchMusicBrainz(query: string): Promise<MusicBrainzResult[]> {
  const response = await fetch(
    `/api/v1/songs/search/musicbrainz?q=${encodeURIComponent(query)}`,
  )
  if (!response.ok) {
    throw new Error(`Failed to search MusicBrainz: ${response.statusText}`)
  }
  const data: unknown = await response.json()
  return musicBrainzResultListSchema.parse(data)
}

export function useSongs(filters?: SongFilters) {
  return useQuery({
    queryKey: songKeys.list(filters),
    queryFn: () => fetchSongs(filters),
  })
}

export function useSong(id: string) {
  return useQuery({
    queryKey: songKeys.detail(id),
    queryFn: () => fetchSong(id),
    enabled: !!id,
  })
}

export function useCreateSong() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSongInput) => createSong(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all })
    },
  })
}

export function useUpdateSong() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSongInput }) =>
      updateSong(id, input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all })
      queryClient.setQueryData(songKeys.detail(data.id), data)
    },
  })
}

export function useDeleteSong() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSong(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all })
    },
  })
}

export function useMusicBrainzSearch(query: string) {
  return useQuery({
    queryKey: songKeys.musicBrainzSearch(query),
    queryFn: () => searchMusicBrainz(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}
