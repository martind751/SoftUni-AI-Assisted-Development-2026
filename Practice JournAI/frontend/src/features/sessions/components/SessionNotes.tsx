import { useState } from 'react'
import { useCreateNote, useDeleteNote } from '../hooks/useSessions'
import { Button } from '../../../components/ui/button'
import type { SessionNote } from '../types/session.types'

interface SessionNotesProps {
  sessionId: string
  notes: SessionNote[]
}

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

export function SessionNotes({ sessionId, notes }: SessionNotesProps) {
  const [newContent, setNewContent] = useState('')
  const createNote = useCreateNote(sessionId)
  const deleteNote = useDeleteNote(sessionId)

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim()) return
    createNote.mutate(
      { content: newContent.trim() },
      { onSuccess: () => setNewContent('') },
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notes</h3>

      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {note.content}
              </p>
              <time className="mt-1 block text-xs text-muted-foreground">
                {formatTimestamp(note.created_at)}
              </time>
            </div>
            <Button
              variant="ghost"
              className="h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => deleteNote.mutate(note.id)}
              disabled={deleteNote.isPending}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddNote} className="flex gap-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          type="submit"
          disabled={createNote.isPending || !newContent.trim()}
          className="self-end"
        >
          {createNote.isPending ? 'Adding...' : 'Add'}
        </Button>
      </form>
    </div>
  )
}
