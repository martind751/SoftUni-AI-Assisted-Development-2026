import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { ResolvedRecommendation, DiscoveryAngle } from '../lib/api'
import WhyModal from './WhyModal'

interface RecommendCardProps {
  rec: ResolvedRecommendation
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
    <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    </div>
  )
}

function CardContent({ rec }: RecommendCardProps) {
  const angle = ANGLE_STYLES[rec.discovery_angle]
  const [showWhy, setShowWhy] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const whyRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    function checkClamp() {
      const el = whyRef.current
      if (el) {
        setIsClamped(el.scrollHeight > el.clientHeight)
      }
    }
    checkClamp()
    window.addEventListener('resize', checkClamp)
    return () => window.removeEventListener('resize', checkClamp)
  }, [rec.why])

  return (
    <div className="flex gap-4">
      {/* Cover image */}
      {rec.image_url ? (
        <img
          src={rec.image_url}
          alt={`${rec.title} by ${rec.artist}`}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <MusicNotePlaceholder />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row: title + angle badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="text-white font-bold truncate">{rec.title}</p>
            <p className="text-slate-400 text-sm truncate">{rec.artist}</p>
          </div>
          <span className={`${angle.bg} ${angle.text} text-xs font-medium rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0`}>
            {angle.label}
          </span>
        </div>

        {/* Why text */}
        <p ref={whyRef} className="text-slate-300 text-sm italic mt-1 line-clamp-2">{rec.why}</p>
        {isClamped && (
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowWhy(true) }}
            className="text-indigo-400 hover:text-indigo-300 text-xs cursor-pointer transition-colors mt-1"
          >
            Read more
          </button>
        )}
        {showWhy && <WhyModal rec={rec} onClose={() => setShowWhy(false)} />}

        {/* Mood tags */}
        {rec.mood_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {rec.mood_tags.map((tag) => (
              <span key={tag} className="bg-slate-800 text-slate-400 text-xs rounded-full px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecommendCard({ rec }: RecommendCardProps) {
  const cardClasses = 'bg-slate-900 rounded-xl border border-slate-800 p-4 hover:bg-slate-800/70 transition-colors'

  // Resolved: link to internal detail page
  if (rec.resolved) {
    const path = `/${rec.type}/${rec.spotify_id}`
    return (
      <Link to={path} className={`block ${cardClasses}`}>
        <CardContent rec={rec} />
      </Link>
    )
  }

  // Not resolved but has spotify_url: external link
  if (rec.spotify_url) {
    return (
      <a href={rec.spotify_url} target="_blank" rel="noopener noreferrer" className={`block ${cardClasses}`}>
        <CardContent rec={rec} />
      </a>
    )
  }

  // No link
  return (
    <div className={cardClasses}>
      <CardContent rec={rec} />
    </div>
  )
}
