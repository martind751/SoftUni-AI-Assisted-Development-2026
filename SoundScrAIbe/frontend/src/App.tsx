import { useState, useEffect } from 'react'

interface HealthStatus {
  status: string
  service: string
  database: string
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">SoundScrAIbe</h1>
        <p className="text-gray-400 mb-4">Your personal music diary</p>
        {error && (
          <div className="bg-red-900/50 text-red-300 p-4 rounded-lg">
            Backend unreachable: {error}
          </div>
        )}
        {health && (
          <div
            className={`p-4 rounded-lg ${
              health.status === 'healthy'
                ? 'bg-green-900/50 text-green-300'
                : 'bg-red-900/50 text-red-300'
            }`}
          >
            <p>Service: {health.service}</p>
            <p>Status: {health.status}</p>
            <p>Database: {health.database}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
