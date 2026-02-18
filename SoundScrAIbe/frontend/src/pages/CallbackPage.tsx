import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeCode } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const codeVerifier = sessionStorage.getItem('code_verifier')

      if (!code || !codeVerifier) {
        setError('Missing authorization code or code verifier')
        return
      }

      try {
        sessionStorage.removeItem('code_verifier')
        await exchangeCode(code, codeVerifier)
        await checkAuth()
        navigate('/profile')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, [navigate, checkAuth])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div>
            <p className="text-red-400 mb-4">{error}</p>
            <a href="/" className="text-green-400 hover:underline">Back to home</a>
          </div>
        ) : (
          <p className="text-gray-400">Signing you in...</p>
        )}
      </div>
    </div>
  )
}
