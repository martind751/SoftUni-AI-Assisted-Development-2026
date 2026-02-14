export function GenreBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-all duration-700"
      style={{ backgroundImage: 'var(--genre-gradient)' }}
      aria-hidden="true"
    />
  )
}
