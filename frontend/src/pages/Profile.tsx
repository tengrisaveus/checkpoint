import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import api from "../api"
import { useAuth } from "../AuthContext"
import type { LibraryEntry } from "../types"
import FavoritePicker from "../components/FavoritePicker"
import Toast from "../components/Toast"
import useTitle from "../hooks/useTitle"

interface LibraryEntryWithGame extends LibraryEntry {
  game_name: string
  game_cover_url: string | null
  is_favorite: boolean
}

interface StatsData {
  total_games: number
  by_status: Record<string, number>
  average_rating: number | null
  rated_count: number
  reviewed_count: number
}

const STATUS_COLORS: Record<string, string> = {
  "Playing": "#3b82f6",
  "Completed": "#22c55e",
  "Want to Play": "#eab308",
  "Dropped": "#ef4444",
}

export default function Profile() {
  useTitle("Profile")
  const { user } = useAuth()
  const navigate = useNavigate()
  const [library, setLibrary] = useState<LibraryEntryWithGame[]>([])
  const [favorites, setFavorites] = useState<LibraryEntryWithGame[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      api.get("/library"),
      api.get("/library/favorites"),
      api.get("/library/stats"),
    ])
      .then(([libRes, favRes, statsRes]) => {
        setLibrary(libRes.data)
        setFavorites(favRes.data)
        setStats(statsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getCoverUrl = (url: string | null) => {
    if (!url) return null
    return url.startsWith("http") ? url : `https:${url}`
  }

  const handleAddFavorite = async (gameId: number) => {
    const newFavIds = [...favorites.map((f) => f.game_id), gameId]
    try {
      await api.put("/library/favorites", newFavIds)
      const added = library.find((e) => e.game_id === gameId)
      if (added) setFavorites([...favorites, added])
      setPickerOpen(false)
      setSuccess("Favorite added!")
    } catch {
      setError("Failed to update favorites")
    }
  }

  const handleRemoveFavorite = async (gameId: number) => {
    const newFavIds = favorites.filter((f) => f.game_id !== gameId).map((f) => f.game_id)
    try {
      await api.put("/library/favorites", newFavIds)
      setFavorites(favorites.filter((f) => f.game_id !== gameId))
      setSuccess("Favorite removed!")
    } catch {
      setError("Failed to update favorites")
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0d0015] text-[#a78bba] p-8">Loading...</div>

  const slots = [0, 1, 2, 3]
  const pieData = stats ? Object.entries(stats.by_status).map(([name, value]) => ({ name, value })) : []
  const barData = stats ? Object.entries(stats.by_status).map(([name, value]) => ({ name, count: value })) : []

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{user?.username}</h1>
        <p className="text-[#a78bba] mb-8">{stats?.total_games || 0} games in library</p>

        {/* Favorite Games */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">Favorite Games</h2>
          <div className="grid grid-cols-4 gap-4">
            {slots.map((i) => {
              const fav = favorites[i]
              if (fav) {
                return (
                  <div key={fav.game_id} className="relative group">
                    <div
                      onClick={() => navigate(`/game/${fav.game_id}`)}
                      className="cursor-pointer"
                    >
                      {getCoverUrl(fav.game_cover_url) ? (
                        <img
                          src={getCoverUrl(fav.game_cover_url)!}
                          alt={fav.game_name}
                          className="w-full aspect-[3/4] object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-lg flex items-center justify-center text-[#8a6baa] text-sm">
                          {fav.game_name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(fav.game_id)}
                      className="absolute top-2 right-2 bg-black/60 text-fuchsia-400 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm"
                    >
                      ✕
                    </button>
                    <p className="text-white text-sm mt-2 truncate">{fav.game_name}</p>
                  </div>
                )
              }
              return (
                <button
                  key={`empty-${i}`}
                  onClick={() => setPickerOpen(true)}
                  className="w-full aspect-[3/4] bg-[#1a0a2e] rounded-lg border-2 border-dashed border-[#2d1b4e] flex items-center justify-center text-[#8a6baa] hover:border-fuchsia-500 hover:text-fuchsia-400 transition cursor-pointer"
                >
                  <span className="text-3xl">+</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && stats.total_games > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1a0a2e] rounded-lg p-4 text-center border border-[#2d1b4e]">
                <p className="text-3xl font-bold text-white">{stats.total_games}</p>
                <p className="text-[#a78bba] text-sm">Total Games</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-lg p-4 text-center border border-[#2d1b4e]">
                <p className="text-3xl font-bold text-green-400">{stats.by_status["Completed"] || 0}</p>
                <p className="text-[#a78bba] text-sm">Completed</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-lg p-4 text-center border border-[#2d1b4e]">
                <p className="text-3xl font-bold text-yellow-400">{stats.average_rating || "—"}</p>
                <p className="text-[#a78bba] text-sm">Avg Rating</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-lg p-4 text-center border border-[#2d1b4e]">
                <p className="text-3xl font-bold text-fuchsia-400">{stats.rated_count}</p>
                <p className="text-[#a78bba] text-sm">Rated</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e]">
                <h2 className="text-lg font-semibold text-white mb-4">Status Distribution</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e]">
                <h2 className="text-lg font-semibold text-white mb-4">Games by Status</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fill: "#a78bba", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#a78bba" }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {stats && stats.total_games === 0 && (
          <p className="text-[#a78bba] text-center">
            No games in library yet.
            <span onClick={() => navigate("/search")} className="text-fuchsia-400 hover:underline cursor-pointer ml-1">
              Search for games
            </span>
          </p>
        )}
      </div>

      {pickerOpen && (
        <FavoritePicker
          library={library}
          currentFavorites={favorites.map((f) => f.game_id)}
          onSelect={handleAddFavorite}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}