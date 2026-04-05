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
      <div className="bg-slate-900 rounded-lg p-6 w-full max-w-md max-h-[80vh] border border-slate-800" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Pick a Favorite</h3>

        <input
          type="text"
          placeholder="Filter library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 border border-slate-700 mb-4"
        />

        <div className="space-y-2 overflow-y-auto max-h-[50vh]">
          {available.length === 0 && (
            <p className="text-slate-400 text-center text-sm">No games available</p>
          )}
          {available.map((entry) => (
            <button
              key={entry.game_id}
              onClick={() => onSelect(entry.game_id)}
              className="w-full flex items-center gap-3 p-3 rounded bg-slate-800 hover:bg-slate-700 transition text-left border border-slate-700"
            >
              {getCoverUrl(entry.game_cover_url) ? (
                <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-10 h-14 object-cover rounded" />
              ) : (
                <div className="w-10 h-14 bg-slate-700 rounded flex items-center justify-center text-slate-500 text-xs">N/A</div>
              )}
              <span className="text-white text-sm">{entry.game_name}</span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full p-2 rounded bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700">
          Cancel
        </button>
      </div>
    </div>
  )
}