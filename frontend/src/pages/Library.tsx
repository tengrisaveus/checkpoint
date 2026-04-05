import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import { GAME_STATUSES } from "../types"
import type { LibraryEntry } from "../types"
import RatingSelector from "../components/RatingSelector"
import { ListSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"

interface LibraryEntryWithGame extends LibraryEntry {
  game_name: string
  game_cover_url: string | null
}

export default function Library() {
  useTitle("My Library")
  const [entries, setEntries] = useState<LibraryEntryWithGame[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [expandedRatingId, setExpandedRatingId] = useState<number | null>(null)
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

  const handleRatingChange = async (gameId: number, newRating: number | null) => {
    try {
      await api.put(`/library/${gameId}`, { rating: newRating })
      setEntries((prev) =>
        prev.map((e) => (e.game_id === gameId ? { ...e, rating: newRating } : e))
      )
      setExpandedRatingId(null)
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

  if (loading) return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <ListSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">My Library</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["", ...GAME_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filter === s
                  ? "bg-fuchsia-500 text-white"
                  : "bg-[#2d1b4e] text-[#c4a8d8] hover:bg-[#3d2b5e] border border-[#3d2b5e]"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-[#a78bba] text-center">
            {filter ? `No ${filter} games` : "Your library is empty."}
            {!filter && (
              <span onClick={() => navigate("/")} className="text-fuchsia-400 hover:underline cursor-pointer ml-1">
                Search for games
              </span>
            )}
          </p>
        )}

        <div className="space-y-4">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-[#1a0a2e] rounded-lg p-4 flex gap-4 items-center border border-[#2d1b4e]">
              <div onClick={() => navigate(`/game/${entry.game_id}`)} className="cursor-pointer">
                {getCoverUrl(entry.game_cover_url) ? (
                  <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-16 h-20 object-cover rounded" />
                ) : (
                  <div className="w-16 h-20 bg-[#2d1b4e] rounded flex items-center justify-center text-[#8a6baa] text-xs">No Cover</div>
                )}
              </div>

              <div className="flex-1">
                <h3
                  onClick={() => navigate(`/game/${entry.game_id}`)}
                  className="text-white font-semibold cursor-pointer hover:text-fuchsia-400 transition"
                >
                  {entry.game_name}
                </h3>

                <div className="flex items-center gap-3 mt-2">
                  <select
                    value={entry.status}
                    onChange={(e) => handleStatusChange(entry.game_id, e.target.value)}
                    className="p-1 rounded bg-[#2d1b4e] text-[#c4a8d8] text-sm outline-none border border-[#3d2b5e]"
                  >
                    {GAME_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setExpandedRatingId(expandedRatingId === entry.game_id ? null : entry.game_id)}
                    className="text-yellow-400 text-sm hover:text-yellow-300 transition"
                  >
                    {entry.rating ? `★ ${entry.rating}` : "Rate"}
                  </button>
                </div>

                {entry.review && <p className="text-[#a78bba] text-sm mt-2">{entry.review}</p>}

                {expandedRatingId === entry.game_id && (
                  <div className="mt-2">
                    <RatingSelector
                      value={entry.rating}
                      onChange={(v) => handleRatingChange(entry.game_id, v)}
                    />
                  </div>
                )}
              </div>

              <button onClick={() => handleDelete(entry.game_id)} className="text-fuchsia-400 hover:text-fuchsia-300 text-sm">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}