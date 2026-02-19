import { Link } from 'react-router-dom'

interface ErrorStateProps {
  message: string
  backTo?: string
  backLabel?: string
}

export default function ErrorState({ message, backTo, backLabel }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{message}</p>
        {backTo && (
          <Link to={backTo} className="text-indigo-400 hover:text-indigo-300 hover:underline">
            {backLabel ?? 'Go back'}
          </Link>
        )}
      </div>
    </div>
  )
}
