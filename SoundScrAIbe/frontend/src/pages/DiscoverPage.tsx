import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import PillGroup from '../components/PillGroup'
import RecommendCard from '../components/RecommendCard'
import {
  getSmartRecommendations,
  getPromptRecommendations,
  RateLimitError,
  type RecommendationResponse,
} from '../lib/api'

type Mode = 'smart' | 'prompt'

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'smart', label: 'Smart Analysis' },
  { value: 'prompt', label: 'Ask for Music' },
]

const PROMPT_SUGGESTIONS = [
  'Rainy day music',
  'Songs that make me feel young',
  'Late night driving',
  'Something I\'ve never heard before',
  'Music for deep focus',
]

const LOADING_STEPS = [
  'Gathering your listening data...',
  'Analysing with AI...',
  'Finding tracks on Spotify...',
]

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DashIcon() {
  return <span className="w-4 h-4 flex items-center justify-center text-slate-600">-</span>
}

function LoadingAnimation({ step }: { step: number }) {
  return (
    <div className="bg-slate-900 rounded-xl p-8 max-w-md mx-auto">
      <div className="space-y-4">
        {LOADING_STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            {i < step ? <CheckIcon /> : i === step ? <SpinnerIcon /> : <DashIcon />}
            <span className={i <= step ? 'text-white' : 'text-slate-500'}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const [mode, setMode] = useState<Mode>('smart')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<RecommendationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [maxCooldown, setMaxCooldown] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown > 0])

  const startLoading = () => {
    setLoading(true)
    setLoadingStep(0)
    setError(null)
    setResult(null)

    // Clear previous timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    const t1 = setTimeout(() => setLoadingStep(1), 2000)
    const t2 = setTimeout(() => setLoadingStep(2), 6000)
    timersRef.current = [t1, t2]
  }

  const stopLoading = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setLoading(false)
  }

  const extractRetryAfter = (err: unknown): number | null => {
    if (err instanceof RateLimitError) {
      return err.retryAfter
    }
    return null
  }

  const handleSmartAnalyse = async () => {
    startLoading()
    try {
      const data = await getSmartRecommendations()
      setResult(data)
    } catch (err) {
      const retryAfter = extractRetryAfter(err)
      if (retryAfter !== null) {
        setCooldown(retryAfter)
        setMaxCooldown(retryAfter)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      stopLoading()
    }
  }

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return
    startLoading()
    try {
      const data = await getPromptRecommendations(prompt.trim())
      setResult(data)
    } catch (err) {
      const retryAfter = extractRetryAfter(err)
      if (retryAfter !== null) {
        setCooldown(retryAfter)
        setMaxCooldown(retryAfter)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      stopLoading()
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setPrompt('')
  }

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Discover</h1>
        <p className="text-slate-400">AI-powered music recommendations</p>
      </div>

      {/* Mode tabs */}
      {!loading && !result && cooldown <= 0 && (
        <div className="mb-8">
          <PillGroup options={MODE_OPTIONS} value={mode} onChange={setMode} size="lg" />
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingAnimation step={loadingStep} />}

      {/* Cooldown state */}
      {!loading && cooldown > 0 && (
        <div className="bg-slate-900 rounded-xl p-8 max-w-md mx-auto text-center">
          <svg className="w-10 h-10 text-indigo-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-white text-lg font-semibold mb-1">
            Ready for new recommendations in {cooldown}s...
          </p>
          <p className="text-slate-400 text-sm">Rate limit reached. Hang tight!</p>
          {/* Progress bar */}
          <div className="mt-5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${maxCooldown > 0 ? ((maxCooldown - cooldown) / maxCooldown) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-slate-900 rounded-xl p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleReset}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results state */}
      {!loading && result && (
        <div>
          {/* Taste summary */}
          {result.taste_summary && (
            <div className="bg-slate-900/50 border-l-4 border-indigo-500 pl-4 py-2 mb-6">
              <p className="text-slate-300 italic">{result.taste_summary}</p>
            </div>
          )}

          {/* Recommendation cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {result.recommendations.map((rec) => (
              <RecommendCard key={`${rec.type}-${rec.spotify_id}`} rec={rec} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              New Recommendations
            </button>
            <Link
              to="/discover/history"
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors text-sm"
            >
              View past recommendations
            </Link>
          </div>
        </div>
      )}

      {/* Smart mode input */}
      {!loading && !result && !error && cooldown <= 0 && mode === 'smart' && (
        <div>
          <p className="text-slate-300 mb-6">
            AI will analyse your listening history, ratings, and tags to suggest music you might love
            — beyond your usual circle.
          </p>
          <button
            onClick={handleSmartAnalyse}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Analyse My Taste
          </button>
        </div>
      )}

      {/* Prompt mode input */}
      {!loading && !result && !error && cooldown <= 0 && mode === 'prompt' && (
        <div>
          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setPrompt(suggestion)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-full px-3 py-1.5 cursor-pointer transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Text input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the music you're looking for..."
            rows={3}
            className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white w-full resize-none placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors mb-4"
          />

          {/* Submit button */}
          <button
            onClick={handlePromptSubmit}
            disabled={!prompt.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed"
          >
            Get Recommendations
          </button>
        </div>
      )}
    </PageShell>
  )
}
