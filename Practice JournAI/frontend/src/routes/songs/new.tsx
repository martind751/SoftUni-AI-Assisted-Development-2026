import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreateSong } from '../../features/songs/hooks/useSongs'
import { SongForm } from '../../features/songs/components/SongForm'

export const Route = createFileRoute('/songs/new')({
  component: NewSongPage,
})

function NewSongPage() {
  const navigate = useNavigate()
  const createSong = useCreateSong()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Add New Song</h2>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
          Beta
        </span>
      </div>
      <SongForm
        onSubmit={(data) => {
          createSong.mutate(data, {
            onSuccess: () => {
              void navigate({ to: '/songs' })
            },
          })
        }}
        isSubmitting={createSong.isPending}
      />
      {createSong.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            Error: {createSong.error.message}
          </p>
        </div>
      )}
    </div>
  )
}
