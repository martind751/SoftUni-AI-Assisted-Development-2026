import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ResolvedRecommendation, DiscoveryAngle } from '../lib/api'

interface WhyModalProps {
  rec: ResolvedRecommendation
  onClose: () => void
}

const ANGLE_STYLES: Record<DiscoveryAngle, { bg: string; text: string; label: string }> = {
  cross_genre: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Cross-Genre' },
  deep_cut: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Deep Cut' },
  era_bridge: { bg: 'bg-teal-500/20', text: 'text-teal-400', label: 'Era Bridge' },
  mood_match: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'Mood Match' },
  artist_evolution: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Evolution' },
}

function MusicNotePlaceholder() {
  return (
    <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-slate-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    </div>
  )
}

export default function WhyModal({ rec, onClose }: WhyModalProps) {
  const angle = ANGLE_STYLES[rec.discovery_angle]

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Track header */}
        <div className="flex gap-4 items-center">
          {rec.image_url ? (
            <img
              src={rec.image_url}
              alt={`${rec.title} by ${rec.artist}`}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <MusicNotePlaceholder />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold truncate">{rec.title}</p>
            <p className="text-slate-400 text-sm truncate">{rec.artist}</p>
            <span className={`${angle.bg} ${angle.text} text-xs font-medium rounded-full px-2 py-0.5 inline-block mt-1`}>
              {angle.label}
            </span>
          </div>
        </div>

        {/* Why label */}
        <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-2 mt-4">
          Why this recommendation
        </p>

        {/* Full why text */}
        <p className="text-slate-300 italic leading-relaxed">{rec.why}</p>

        {/* Mood tags */}
        {rec.mood_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {rec.mood_tags.map((tag) => (
              <span key={tag} className="bg-slate-800 text-slate-400 text-xs rounded-full px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
