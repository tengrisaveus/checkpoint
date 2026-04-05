import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { DiaryEntry } from "../types"
import { ListSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Group entries by month
  const grouped: Record<string, DiaryEntry[]> = {}
  entries.forEach((entry) => {
    const monthKey = new Date(entry.played_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
    if (!grouped[monthKey]) grouped[monthKey] = []
    grouped[monthKey].push(entry)
  })

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
        <h1 className="text-3xl font-bold text-white mb-6">Diary</h1>

        {entries.length === 0 && (
          <p className="text-[#a78bba] text-center">
            No diary entries yet.
            <span onClick={() => navigate("/search")} className="text-fuchsia-400 hover:underline cursor-pointer ml-1">
              Search for games
            </span>
          </p>
        )}

        {Object.entries(grouped).map(([month, monthEntries]) => (
          <div key={month} className="mb-8">
            <h2 className="text-lg font-semibold text-[#a78bba] mb-4">{month}</h2>
            <div className="space-y-3">
              {monthEntries.map((entry) => (
                <div key={entry.id} className="bg-[#1a0a2e] rounded-lg p-4 flex gap-4 items-center border border-[#2d1b4e]">
                  <div onClick={() => navigate(`/game/${entry.game_id}`)} className="cursor-pointer">
                    {getCoverUrl(entry.game_cover_url) ? (
                      <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-12 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-16 bg-[#2d1b4e] rounded flex items-center justify-center text-[#8a6baa] text-xs">N/A</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3
                        onClick={() => navigate(`/game/${entry.game_id}`)}
                        className="text-white font-semibold cursor-pointer hover:text-fuchsia-400 transition"
                      >
                        {entry.game_name}
                      </h3>
                      {entry.rating && (
                        <span className="text-yellow-400 text-sm">★ {entry.rating}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[#8a6baa] text-sm">{formatDate(entry.played_at)}</span>
                      <span className="text-[#8a6baa] text-sm">·</span>
                      <span className="text-[#a78bba] text-sm">{entry.status}</span>
                    </div>
                    {entry.note && <p className="text-[#a78bba] text-sm mt-2">{entry.note}</p>}
                  </div>

                  <button onClick={() => handleDelete(entry.id)} className="text-fuchsia-400 hover:text-fuchsia-300 text-sm">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}