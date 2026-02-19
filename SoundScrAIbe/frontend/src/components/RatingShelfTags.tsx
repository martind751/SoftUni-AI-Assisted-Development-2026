import { useState, useEffect } from 'react'
import RatingSelector from './RatingSelector'
import ShelfSelector from './ShelfSelector'
import TagInput from './TagInput'
import {
  setRating,
  deleteRating,
  setShelf,
  deleteShelf,
  setTags,
  getUserTags,
} from '../lib/api'

interface RatingShelfTagsProps {
  entityType: 'track' | 'album' | 'artist'
  entityId: string
  entityName: string
  entityImageUrl: string
  initialRating: number | null
  initialShelf: string | null
  initialTags: string[]
}

export default function RatingShelfTags({
  entityType,
  entityId,
  entityName,
  entityImageUrl,
  initialRating,
  initialShelf,
  initialTags,
}: RatingShelfTagsProps) {
  const [rating, setRatingState] = useState<number | null>(initialRating)
  const [shelf, setShelfState] = useState<string | null>(initialShelf)
  const [tags, setTagsState] = useState<string[]>(initialTags)
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])

  useEffect(() => {
    getUserTags()
      .then((data) => setTagSuggestions(data.map((t) => t.name)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setRatingState(initialRating)
    setShelfState(initialShelf)
    setTagsState(initialTags)
  }, [initialRating, initialShelf, initialTags])

  async function handleRatingChange(score: number | null) {
    const prev = rating
    setRatingState(score)
    try {
      if (score === null) {
        await deleteRating(entityType, entityId)
      } else {
        await setRating(entityType, entityId, score, entityName, entityImageUrl)
      }
    } catch {
      setRatingState(prev)
    }
  }

  async function handleShelfChange(status: string | null) {
    const prev = shelf
    setShelfState(status)
    try {
      if (status === null) {
        await deleteShelf(entityType, entityId)
      } else {
        await setShelf(entityType, entityId, status, entityName, entityImageUrl)
      }
    } catch {
      setShelfState(prev)
    }
  }

  async function handleTagsChange(newTags: string[]) {
    const prev = tags
    setTagsState(newTags)
    try {
      await setTags(entityType, entityId, newTags, entityName, entityImageUrl)
    } catch {
      setTagsState(prev)
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold mb-5">Your Rating & Collection</h2>
      <div className="space-y-5">
        <RatingSelector value={rating} onChange={handleRatingChange} />
        <ShelfSelector value={shelf} onChange={handleShelfChange} />
        <TagInput tags={tags} onChange={handleTagsChange} suggestions={tagSuggestions} />
      </div>
    </div>
  )
}
