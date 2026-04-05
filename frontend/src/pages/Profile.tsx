import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 p-8">Loading...</div>

  const slots = [0, 1, 2, 3]

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{user?.username}</h1>
        <p className="text-slate-400 mb-8">{stats?.total_games || 0} games in library</p>

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
                        <div className="w-full aspect-[3/4] bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-sm">
                          {fav.game_name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(fav.game_id)}
                      className="absolute top-2 right-2 bg-black/60 text-red-400 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm"
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
                  className="w-full aspect-[3/4] bg-slate-900 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:border-red-500 hover:text-red-400 transition cursor-pointer"
                >
                  <span className="text-3xl">+</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Stats */}
        {stats && stats.total_games > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-800">
              <p className="text-3xl font-bold text-white">{stats.total_games}</p>
              <p className="text-slate-400 text-sm">Total Games</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-800">
              <p className="text-3xl font-bold text-green-400">{stats.by_status["Completed"] || 0}</p>
              <p className="text-slate-400 text-sm">Completed</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-800">
              <p className="text-3xl font-bold text-yellow-400">{stats.average_rating || "—"}</p>
              <p className="text-slate-400 text-sm">Avg Rating</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-800">
              <p className="text-3xl font-bold text-red-400">{stats.rated_count}</p>
              <p className="text-slate-400 text-sm">Rated</p>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/stats")}
          className="text-red-400 hover:underline text-sm"
        >
          View detailed stats →
        </button>
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