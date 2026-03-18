import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import { GAME_STATUSES } from "../types"
import type { LibraryEntry } from "../types"

interface LibraryEntryWithGame extends LibraryEntry {
  game_name: string
  game_cover_url: string | null
}

export default function Library() {
  const [entries, setEntries] = useState<LibraryEntryWithGame[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    api.get("/library")
      .then((res) => setEntries(res.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (gameId: number) => {
    try {
      await api.delete(`/library/${gameId}`)
      setEntries((prev) => prev.filter((e) => e.game_id !== gameId))
    } catch {
      // ignore
    }
  }

  const handleStatusChange = async (gameId: number, newStatus: string) => {
    try {
      await api.put(`/library/${gameId}`, { status: newStatus })
      setEntries((prev) =>
        prev.map((e) => (e.game_id === gameId ? { ...e, status: newStatus } : e))
      )
    } catch {
      // ignore
    }
  }

  const getCoverUrl = (url: string | null) => {
    if (!url) return null
    return url.startsWith("http") ? url : `https:${url}`
  }

  const filtered = filter ? entries.filter((e) => e.status === filter) : entries

  if (loading) return <div className="min-h-screen bg-gray-900 text-gray-400 p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">My Library</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["", ...GAME_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-gray-400 text-center">
            {filter ? `No ${filter} games` : "Your library is empty."}
            {!filter && (
              <span onClick={() => navigate("/")} className="text-blue-400 hover:underline cursor-pointer ml-1">
                Search for games
              </span>
            )}
          </p>
        )}

        <div className="space-y-4">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-gray-800 rounded-lg p-4 flex gap-4 items-center">
              <div onClick={() => navigate(`/game/${entry.game_id}`)} className="cursor-pointer">
                {getCoverUrl(entry.game_cover_url) ? (
                  <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-16 h-20 object-cover rounded" />
                ) : (
                  <div className="w-16 h-20 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">No Cover</div>
                )}
              </div>

              <div className="flex-1">
                <h3
                  onClick={() => navigate(`/game/${entry.game_id}`)}
                  className="text-white font-semibold cursor-pointer hover:text-blue-400"
                >
                  {entry.game_name}
                </h3>

                <div className="flex items-center gap-3 mt-2">
                  <select
                    value={entry.status}
                    onChange={(e) => handleStatusChange(entry.game_id, e.target.value)}
                    className="p-1 rounded bg-gray-700 text-gray-300 text-sm outline-none"
                  >
                    {GAME_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  {entry.rating && <span className="text-yellow-400 text-sm">★ {entry.rating}</span>}
                </div>

                {entry.review && <p className="text-gray-400 text-sm mt-2">{entry.review}</p>}
              </div>

              <button onClick={() => handleDelete(entry.game_id)} className="text-red-400 hover:text-red-300 text-sm">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}