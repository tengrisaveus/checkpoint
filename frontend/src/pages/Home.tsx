import { useNavigate } from "react-router-dom"
import { useAuth } from "../AuthContext"
import useTitle from "../hooks/useTitle"
import { useEffect, useState } from "react"
import api from "../api"
import type { DiaryEntry } from "../types"

interface LibraryEntryWithGame {
  game_id: number
  game_name: string
  game_cover_url: string | null
  status: string
  rating: number | null
}

export default function Home() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [recentGames, setRecentGames] = useState<LibraryEntryWithGame[]>([])
  const [recentDiary, setRecentDiary] = useState<DiaryEntry[]>([])
  const [demoLoading, setDemoLoading] = useState(false)

  useTitle(user ? "Home" : "Checkpoint — Track Your Games")

  useEffect(() => {
    if (!user) return
    api.get("/library").then((res) => setRecentGames(res.data.slice(0, 6))).catch(() => {})
    api.get("/diary").then((res) => setRecentDiary(res.data.slice(0, 5))).catch(() => {})
  }, [user])

  const handleDemo = async () => {
    setDemoLoading(true)
    try {
      await login("demo@checkpoint.app", "demo123456")
    } catch {
      setDemoLoading(false)
    }
  }

  const getCoverUrl = (url: string | null) => {
    if (!url) return null
    return url.startsWith("http") ? url : `https:${url}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (loading) return null

  // Logged out — landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d0015]">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
          <img src="/checkpoint-logo.png" alt="Checkpoint" className="h-16 mx-auto mb-8" />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Track Your <span className="text-fuchsia-500">Gaming</span> Journey
          </h1>
          <p className="text-[#a78bba] text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Keep a record of every game you play. Rate, review, and see your stats — all in one place.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition text-lg"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/search")}
              className="px-8 py-3 rounded bg-[#2d1b4e] text-[#c4a8d8] font-semibold hover:bg-[#3d2b5e] transition text-lg border border-[#3d2b5e]"
            >
              Browse Games
            </button>
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="px-8 py-3 rounded bg-[#1a0a2e] text-fuchsia-400 font-semibold hover:text-fuchsia-300 transition text-lg border border-fuchsia-500/50"
            >
              {demoLoading ? "Logging in..." : "Try Demo"}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e] text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-white font-semibold text-lg mb-2">Search</h3>
              <p className="text-[#a78bba] text-sm">Browse thousands of games from the IGDB database</p>
            </div>
            <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e] text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-white font-semibold text-lg mb-2">Track</h3>
              <p className="text-[#a78bba] text-sm">Mark games as Playing, Completed, Want to Play, or Dropped</p>
            </div>
            <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e] text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-white font-semibold text-lg mb-2">Stats</h3>
              <p className="text-[#a78bba] text-sm">See your gaming statistics with charts and insights</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Logged in — dashboard
  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.username}</h1>
        <p className="text-[#a78bba] mb-8">Here's your gaming activity</p>

        {/* Recent Library */}
        {recentGames.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Library</h2>
              <button onClick={() => navigate("/library")} className="text-fuchsia-400 hover:text-fuchsia-300 text-sm transition">
                View all →
              </button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {recentGames.map((game) => (
                <div
                  key={game.game_id}
                  onClick={() => navigate(`/game/${game.game_id}`)}
                  className="cursor-pointer group"
                >
                  {getCoverUrl(game.game_cover_url) ? (
                    <img
                      src={getCoverUrl(game.game_cover_url)!}
                      alt={game.game_name}
                      className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 group-hover:ring-fuchsia-500 transition"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-lg flex items-center justify-center text-[#8a6baa] text-xs text-center p-1">
                      {game.game_name}
                    </div>
                  )}
                  <p className="text-white text-xs mt-1 truncate">{game.game_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Diary */}
        {recentDiary.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Diary</h2>
              <button onClick={() => navigate("/diary")} className="text-fuchsia-400 hover:text-fuchsia-300 text-sm transition">
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {recentDiary.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/game/${entry.game_id}`)}
                  className="bg-[#1a0a2e] rounded-lg p-3 flex items-center gap-3 border border-[#2d1b4e] cursor-pointer hover:border-fuchsia-500/30 transition"
                >
                  {getCoverUrl(entry.game_cover_url) ? (
                    <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-[#2d1b4e] rounded" />
                  )}
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{entry.game_name}</p>
                    <p className="text-[#8a6baa] text-xs">
                      {formatDate(entry.played_at)} · {entry.status}
                      {entry.rating && ` · ★ ${entry.rating}`}
                    </p>
                  </div>
                  {entry.note && <p className="text-[#8a6baa] text-xs hidden md:block max-w-[200px] truncate">{entry.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/search")}
            className="bg-[#1a0a2e] rounded-lg p-4 border border-[#2d1b4e] text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-white text-sm font-medium">Search Games</p>
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="bg-[#1a0a2e] rounded-lg p-4 border border-[#2d1b4e] text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">👤</div>
            <p className="text-white text-sm font-medium">Profile</p>
          </button>
          <button
            onClick={() => navigate("/diary")}
            className="bg-[#1a0a2e] rounded-lg p-4 border border-[#2d1b4e] text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">📖</div>
            <p className="text-white text-sm font-medium">Diary</p>
          </button>
          <button
            onClick={() => navigate("/lists")}
            className="bg-[#1a0a2e] rounded-lg p-4 border border-[#2d1b4e] text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">📋</div>
            <p className="text-white text-sm font-medium">Lists</p>
          </button>
        </div>
      </div>
    </div>
  )
}