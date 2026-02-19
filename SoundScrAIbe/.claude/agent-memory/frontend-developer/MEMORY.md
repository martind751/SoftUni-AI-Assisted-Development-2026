# SoundScrAIbe Frontend - Agent Memory

## Project Stack
- React 19 + Vite + TypeScript + Tailwind v4
- React Router DOM v7
- No component library, all custom with inline Tailwind
- Icons: inline SVG (no icon library)
- Charting: Recharts

## Key Paths
- Frontend root: `frontend/`
- Pages: `frontend/src/pages/`
- Components: `frontend/src/components/`
- API layer: `frontend/src/lib/api.ts`
- Auth context: `frontend/src/context/AuthContext.tsx`
- Router: `frontend/src/App.tsx`

## Design System
- Dark theme: `bg-gray-950` page bg, `bg-gray-900` cards, `bg-gray-800` inputs/sub-cards
- Accent: `indigo-400` (text/links), `indigo-500` (buttons/fills)
- Gradient: `from-indigo-400 to-violet-500` (hero title)
- Card pattern: `bg-gray-900 rounded-xl p-6 mb-8`
- Pill buttons: `rounded-full` with `px-3 py-1.5 text-sm`
- Selected state: `bg-indigo-500 text-white font-semibold`
- Links: `text-indigo-400 hover:text-indigo-300 hover:underline transition-colors`
- Recharts bar fill hex: `#6366F1` (indigo-500)

## Auth Pattern
- `useAuth()` hook from AuthContext
- Auth guard: `useEffect` redirect to `/` if not logged in
- Loading state: full-screen centered "Loading..." in `text-gray-400`

## TypeScript Notes
- React 19 does NOT export global `JSX` namespace - use `ReactNode` from 'react' instead of `JSX.Element`
- Avoid `any` types - use proper interfaces

## Pages Implemented
- HomePage, CallbackPage, ProfilePage, ListeningHistoryPage, ArtistChartsPage
- TrackDetailPage, AlbumDetailPage, ArtistDetailPage, LibraryPage

## Rating System Components
- `RatingSelector` - 10 numbered circles, hover preview, click-to-deselect
- `ShelfSelector` - 3 pill buttons (Listened, Listening, Want to Listen)
- `TagInput` - pills + text input with autocomplete dropdown
- `RatingShelfTags` - composite wrapper with optimistic API updates
