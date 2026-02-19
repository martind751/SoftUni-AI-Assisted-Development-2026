import { useState } from 'react'

interface RatingSelectorProps {
  value: number | null
  onChange: (score: number | null) => void
}

export default function RatingSelector({ value, onChange }: RatingSelectorProps) {
  const [hoverScore, setHoverScore] = useState<number | null>(null)

  const displayScore = hoverScore ?? value

  return (
    <div>
      <p className="text-sm text-slate-400 mb-2">Your Rating</p>
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
          const isFilled = displayScore !== null && score <= displayScore
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score === value ? null : score)}
              onMouseEnter={() => setHoverScore(score)}
              onMouseLeave={() => setHoverScore(null)}
              className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors ${
                isFilled
                  ? 'bg-indigo-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              aria-label={`Rate ${score} out of 10`}
            >
              {score}
            </button>
          )
        })}
      </div>
    </div>
  )
}
