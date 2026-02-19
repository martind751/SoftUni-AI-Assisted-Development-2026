interface PageShellProps {
  children: React.ReactNode
  title?: string
  narrow?: boolean
  className?: string
}

export default function PageShell({ children, title, narrow, className }: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className={`${narrow ? 'max-w-2xl' : 'max-w-5xl'} mx-auto px-4 py-8 ${className ?? ''}`}>
        {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
        {children}
      </div>
    </div>
  )
}
