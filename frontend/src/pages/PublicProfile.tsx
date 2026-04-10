import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"
import useTitle from "../hooks/useTitle"

interface PublicProfileData {
  user: {
    username: string
    created_at: string
  }
  stats: {
    total_games: number
    by_status: Record<string, number>
    average_rating: number | null
    rated_count: number
    completion_ratio: number
    top_genres: { name: string; count: number }[]
  }
  favorites: {
    game_id: number
    game_name: string
    game_cover_url: string | null
  }[]
  monthly: {
    month: string
    label: string
    count: number
  }[]
  recent_diary: {
    game_id: number
    game_name: string
    game_cover_url: string | null
    played_at: string
    status: string
    rating: number | null
    note: string | null
  }[]
  lists: {
    id: number
    name: string
    description: string | null
    item_count: number
    preview_covers: string[]
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
}

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useTitle(data ? `${data.user.username}'s Profile` : "Profile")

  useEffect(() => {
    api
      .get(`/profile/${username}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [username])

  const getCoverUrl = (url: string | null) => {
    if (!url) return null
    return url.startsWith("http") ? url : `https:${url}`
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#0d0015] text-[#a78bba] p-8 flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading profile...</div>
      </div>
    )

  if (notFound)
    return (
      <div className="min-h-screen bg-[#0d0015] text-[#a78bba] p-8 text-center">
        <p className="text-xl mb-2">User not found</p>
        <button
          onClick={() => navigate("/")}
          className="text-fuchsia-400 hover:text-fuchsia-300 transition"
        >
          ← Back to home
        </button>
      </div>
    )

  if (!data) return null

  const { user, stats, favorites, monthly, recent_diary, lists } = data
  const completionDash = 163.36 - (163.36 * stats.completion_ratio) / 100
  const maxMonthly = Math.max(...monthly.map((m) => m.count), 1)
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#2d1b4e] flex items-center justify-center text-2xl font-medium text-fuchsia-400">
            {user.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-medium text-white">{user.username}</h1>
            <p className="text-[#8a6baa] text-sm">
              {stats.total_games} games · Member since {memberSince}
            </p>
          </div>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <>
            <h2 className="text-[15px] font-medium text-white mb-3">Favorite games</h2>
            <div className="grid grid-cols-4 gap-3 mb-8">
              {favorites.map((fav) => (
                <div key={fav.game_id}>
                  <div onClick={() => navigate(`/game/${fav.game_id}`)} className="cursor-pointer">
                    {getCoverUrl(fav.game_cover_url) ? (
                      <img src={getCoverUrl(fav.game_cover_url)!} alt={fav.game_name} className="w-full aspect-[3/4] object-cover rounded-[10px]" />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-[10px] flex items-center justify-center text-[#8a6baa] text-sm">{fav.game_name}</div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#c4a8d8] mt-1.5 truncate">{fav.game_name}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {stats.total_games > 0 && (
          <>
            {/* Completion + Avg Rating */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-2 bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#2d1b4e" strokeWidth="6" />
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray="163.36" strokeDashoffset={completionDash} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-white font-medium">{stats.completion_ratio}%</div>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#8a6baa]">Completion rate</p>
                    <p className="text-[13px] text-[#a78bba] mt-1">{stats.by_status["Completed"] || 0} of {stats.total_games} games completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 flex flex-col items-center justify-center">
                <p className="text-3xl font-medium text-yellow-400">{stats.average_rating || "—"}</p>
                <p className="text-[12px] text-[#8a6baa]">Avg rating</p>
              </div>
            </div>

            {/* Small stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-white">{stats.total_games}</p>
                <p className="text-[11px] text-[#8a6baa]">Total</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-green-400">{stats.by_status["Completed"] || 0}</p>
                <p className="text-[11px] text-[#8a6baa]">Completed</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-blue-400">{stats.by_status["Playing"] || 0}</p>
                <p className="text-[11px] text-[#8a6baa]">Playing</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-red-400">{stats.by_status["Dropped"] || 0}</p>
                <p className="text-[11px] text-[#8a6baa]">Dropped</p>
              </div>
            </div>

            {/* Top Genres */}
            {stats.top_genres.length > 0 && (
              <>
                <h2 className="text-[15px] font-medium text-white mb-3">Top genres</h2>
                <div className="flex gap-2 flex-wrap mb-8">
                  {stats.top_genres.map((genre) => (
                    <span key={genre.name} className="px-3 py-1.5 rounded-full bg-[#1a0a2e] border border-[#2d1b4e]/50 text-[12px] text-[#c4a8d8]">
                      {genre.name} <span className="text-fuchsia-400 font-medium">{genre.count}</span>
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Status Breakdown */}
            <h2 className="text-[15px] font-medium text-white mb-3">Status breakdown</h2>
            <div className="bg-[#1a0a2e] rounded-xl p-5 border border-[#2d1b4e]/50 mb-8">
              {Object.entries(stats.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span className="text-[12px] text-[#a78bba] w-24 text-right shrink-0">{status}</span>
                  <div className="flex-1 h-2 bg-[#0d0015] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / stats.total_games) * 100}%`, backgroundColor: STATUS_COLORS[status] || "#6b7280" }} />
                  </div>
                  <span className="text-[12px] text-[#8a6baa] w-6">{count}</span>
                </div>
              ))}
            </div>

            {/* Monthly Activity */}
            {monthly.some((m) => m.count > 0) && (
              <>
                <h2 className="text-[15px] font-medium text-white mb-3">Monthly activity</h2>
                <div className="bg-[#1a0a2e] rounded-xl p-5 border border-[#2d1b4e]/50 mb-8">
                  <div className="flex items-end gap-2 h-24">
                    {monthly.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-fuchsia-500" style={{ height: m.count > 0 ? `${(m.count / maxMonthly) * 80}px` : "4px", opacity: m.count > 0 ? 1 : 0.2 }} />
                        <span className="text-[11px] text-[#8a6baa]">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Recent Diary */}
        {recent_diary.length > 0 && (
          <>
            <h2 className="text-[15px] font-medium text-white mb-3">Recent diary</h2>
            <div className="space-y-2 mb-8">
              {recent_diary.map((entry, i) => (
                <div key={i} onClick={() => navigate(`/game/${entry.game_id}`)} className="flex items-center gap-3 bg-[#1a0a2e] rounded-lg p-3 border border-[#2d1b4e]/50 cursor-pointer hover:border-fuchsia-500/30 transition">
                  {getCoverUrl(entry.game_cover_url) ? (
                    <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-[#2d1b4e] rounded flex items-center justify-center text-[#8a6baa] text-[8px]">?</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{entry.game_name}</p>
                    <p className="text-[11px] text-[#8a6baa]">
                      {entry.played_at} · {entry.status}
                      {entry.rating && ` · ★ ${entry.rating}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lists */}
        {lists.length > 0 && (
          <>
            <h2 className="text-[15px] font-medium text-white mb-3">Lists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {lists.map((list) => (
                <div key={list.id} className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50">
                  <p className="text-sm font-medium text-white">{list.name}</p>
                  <p className="text-[11px] text-[#8a6baa] mt-1">{list.item_count} game{list.item_count !== 1 ? "s" : ""}</p>
                  {list.preview_covers.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {list.preview_covers.slice(0, 4).map((cover, i) => (
                        <img key={i} src={cover.startsWith("http") ? cover : `https:${cover}`} alt="" className="w-10 h-14 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {stats.total_games === 0 && (
          <p className="text-[#8a6baa] text-center">This user hasn't added any games yet.</p>
        )}
      </div>
    </div>
  )
}