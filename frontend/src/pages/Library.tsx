import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import { GAME_STATUSES } from "../types"
import type { LibraryEntry } from "../types"
import RatingSelector from "../components/RatingSelector"
import { ListSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
}

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
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      <div className="max-w-[1440px] mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <ListSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      <div className="max-w-[1440px] mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)] mb-6">My Library</h1>

        {/* Filter chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["", ...GAME_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition flex items-center gap-2 ${
                filter === s
                  ? "bg-[var(--cp-accent)] text-white"
                  : "text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50"
              }`}
            >
              {s && <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[s] || "#6b7280" }} />}
              {s || "All"}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-[var(--cp-text-dim)] text-center font-display text-xl italic mt-12">
            {filter ? `No ${filter} games` : "Your library is empty."}
            {!filter && (
              <span onClick={() => navigate("/search")} className="text-[var(--cp-accent)] hover:brightness-110 cursor-pointer ml-2 not-italic text-base">
                Search for games →
              </span>
            )}
          </p>
        )}

        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-[var(--cp-surf)] rounded-lg p-4 flex gap-4 items-center border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/20 transition">
              <div onClick={() => navigate(`/game/${entry.game_id}`)} className="cursor-pointer">
                {getCoverUrl(entry.game_cover_url) ? (
                  <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-16 h-20 object-cover rounded-md cover-hover" />
                ) : (
                  <div className="w-16 h-20 bg-[var(--cp-surf-2)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-xs cover-placeholder">N/A</div>
                )}
              </div>

              <div className="flex-1">
                <h3
                  onClick={() => navigate(`/game/${entry.game_id}`)}
                  className="text-[var(--cp-text)] font-semibold cursor-pointer hover:text-[var(--cp-accent)] transition"
                >
                  {entry.game_name}
                </h3>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[entry.status] || "#6b7280" }} />
                    <select
                      value={entry.status}
                      onChange={(e) => handleStatusChange(entry.game_id, e.target.value)}
                      className="p-1 rounded-sm bg-transparent text-[var(--cp-text-dim)] text-sm outline-none border border-[var(--cp-border)] focus:border-[var(--cp-accent)]/50"
                    >
                      {GAME_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setExpandedRatingId(expandedRatingId === entry.game_id ? null : entry.game_id)}
                    className="font-mono text-sm text-[var(--cp-star)] hover:brightness-110 transition"
                  >
                    {entry.rating ? `★ ${entry.rating}` : "—"}
                  </button>
                </div>

                {entry.review && <p className="text-[var(--cp-text-dim)] text-sm mt-2">{entry.review}</p>}

                {expandedRatingId === entry.game_id && (
                  <div className="mt-2">
                    <RatingSelector
                      value={entry.rating}
                      onChange={(v) => handleRatingChange(entry.game_id, v)}
                    />
                  </div>
                )}
              </div>

              <button onClick={() => handleDelete(entry.game_id)} className="text-[var(--cp-accent)] hover:brightness-110 text-sm transition">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
