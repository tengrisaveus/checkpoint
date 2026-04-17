import { useState } from "react"
import type { LibraryEntry } from "../types"

interface LibraryEntryWithGame extends LibraryEntry {
  game_name: string
  game_cover_url: string | null
}

interface FavoritePickerProps {
  library: LibraryEntryWithGame[]
  currentFavorites: number[]
  onSelect: (gameId: number) => void
  onClose: () => void
}

export default function FavoritePicker({ library, currentFavorites, onSelect, onClose }: FavoritePickerProps) {
  const [search, setSearch] = useState("")

  const available = library.filter(
    (e) => !currentFavorites.includes(e.game_id) &&
    e.game_name.toLowerCase().includes(search.toLowerCase())
  )

  const getCoverUrl = (url: string | null) => {
    if (!url) return null
    return url.startsWith("http") ? url : `https:${url}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--cp-surf)] rounded-lg p-6 w-full max-w-md max-h-[80vh] border border-[var(--cp-border)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl text-[var(--cp-text)] mb-4">Pick a Favorite</h3>

        <input
          type="text"
          placeholder="Filter library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)] mb-4"
        />

        <div className="space-y-2 overflow-y-auto max-h-[50vh]">
          {available.length === 0 && (
            <p className="text-[var(--cp-text-dim)] text-center text-sm italic font-display">No games available</p>
          )}
          {available.map((entry) => (
            <button
              key={entry.game_id}
              onClick={() => onSelect(entry.game_id)}
              className="w-full flex items-center gap-3 p-3 rounded-sm bg-transparent hover:bg-[var(--cp-surf-2)] transition text-left border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/40"
            >
              {getCoverUrl(entry.game_cover_url) ? (
                <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-10 h-14 object-cover rounded-sm" />
              ) : (
                <div className="w-10 h-14 bg-[var(--cp-surf-2)] rounded-sm flex items-center justify-center text-[var(--cp-text-dimmer)] text-[10px] cover-placeholder">N/A</div>
              )}
              <span className="text-[var(--cp-text)] text-sm">{entry.game_name}</span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full p-2 rounded-sm bg-transparent text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition border border-[var(--cp-border)]">
          Cancel
        </button>
      </div>
    </div>
  )
}
