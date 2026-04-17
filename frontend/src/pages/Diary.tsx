import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { DiaryEntry } from "../types"
import { ListSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
}

export default function Diary() {
  useTitle("Diary")
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get("/diary")
      .then((res) => setEntries(res.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (entryId: number) => {
    try {
      await api.delete(`/diary/${entryId}`)
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    } catch {
      // ignore
    }
  }

  const getCoverUrl = (url: string | null) => {
    if (!url) return null
    return url.startsWith("http") ? url : `https:${url}`
  }

  const formatDayHeader = (dateStr: string) => {
    const d = new Date(dateStr)
    const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
    const num = d.getDate()
    return `${day} · ${num}`
  }

  // Group entries by month, then by day within each month
  const grouped: Record<string, DiaryEntry[]> = {}
  entries.forEach((entry) => {
    const monthKey = new Date(entry.played_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
    if (!grouped[monthKey]) grouped[monthKey] = []
    grouped[monthKey].push(entry)
  })

  // Count stats per month
  const getMonthStats = (monthEntries: DiaryEntry[]) => {
    const uniqueGames = new Set(monthEntries.map((e) => e.game_id)).size
    const completed = monthEntries.filter((e) => e.status === "Completed").length
    const ratings = monthEntries.filter((e) => e.rating).map((e) => e.rating!)
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null
    return { entries: monthEntries.length, games: uniqueGames, completed, avgRating }
  }

  // Group entries within a month by day
  const groupByDay = (monthEntries: DiaryEntry[]) => {
    const days: Record<string, DiaryEntry[]> = {}
    monthEntries.forEach((entry) => {
      const dayKey = entry.played_at.split("T")[0]
      if (!days[dayKey]) days[dayKey] = []
      days[dayKey].push(entry)
    })
    return Object.entries(days)
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <ListSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)] mb-8">Diary</h1>

        {entries.length === 0 && (
          <p className="text-[var(--cp-text-dim)] text-center font-display text-xl italic mt-12">
            No diary entries yet.
            <span onClick={() => navigate("/search")} className="text-[var(--cp-accent)] cursor-pointer hover:brightness-110 transition not-italic text-base ml-2">
              Search for games →
            </span>
          </p>
        )}

        {Object.entries(grouped).map(([month, monthEntries]) => {
          const stats = getMonthStats(monthEntries)
          const days = groupByDay(monthEntries)

          return (
            <div key={month} className="mb-10">
              <div className="mb-4">
                <h2 className="font-display text-2xl text-[var(--cp-text)]">{month}</h2>
                <p className="font-mono text-[var(--cp-text-dim)] text-[11px] mt-1">
                  {stats.entries} entries · {stats.games} games · {stats.completed} completed
                  {stats.avgRating && ` · avg ★ ${stats.avgRating}`}
                </p>
              </div>

              {days.map(([dayKey, dayEntries]) => (
                <div key={dayKey} className="mb-4">
                  <div className="flex gap-3 items-baseline border-b border-[var(--cp-border)] pb-1.5 mb-2">
                    <span className="font-mono text-[11px] text-[var(--cp-accent)] tracking-wide">
                      {formatDayHeader(dayKey)}
                    </span>
                  </div>

                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid items-center gap-3 py-2.5 border-b border-dashed border-[var(--cp-border)]/50 last:border-none"
                      style={{ gridTemplateColumns: "auto 1fr auto auto" }}
                    >
                      <div onClick={() => navigate(`/game/${entry.game_id}`)} className="cursor-pointer">
                        {getCoverUrl(entry.game_cover_url) ? (
                          <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-8 aspect-[3/4] object-cover rounded-sm" />
                        ) : (
                          <div className="w-8 aspect-[3/4] bg-[var(--cp-surf-2)] rounded-sm" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          onClick={() => navigate(`/game/${entry.game_id}`)}
                          className="text-[var(--cp-text)] text-[13px] cursor-pointer hover:text-[var(--cp-accent)] transition truncate"
                        >
                          {entry.game_name}
                        </p>
                        <p className="text-[var(--cp-text-dim)] text-[11px] truncate">
                          <span className="inline-flex items-center gap-1">
                            <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[entry.status] || "#6b7280" }} />
                            {entry.status}
                          </span>
                          {entry.note && ` · "${entry.note}"`}
                        </p>
                      </div>

                      <span className="font-mono text-[11px] text-[var(--cp-star)]">
                        {entry.rating ? `★ ${entry.rating}` : "—"}
                      </span>

                      <button onClick={() => handleDelete(entry.id)} className="text-[var(--cp-text-dimmer)] hover:text-[var(--cp-accent)] text-xs transition">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
