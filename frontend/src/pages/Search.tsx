import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { Game } from "../types"
import { getCoverUrl, getYear } from "../utils"
import { CardSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"

export default function Search() {
  useTitle("Search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await api.get("/games/search", { params: { query } })
      setResults(res.data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Search Games</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Search for a game..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition"
          >
            Search
          </button>
        </form>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((game) => (
            <div
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              className="bg-[#1a0a2e] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-fuchsia-500 transition border border-[#2d1b4e]"
            >
              {getCoverUrl(game) ? (
                <img src={getCoverUrl(game)!} alt={game.name} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-[#2d1b4e] flex items-center justify-center text-[#8a6baa]">No Cover</div>
              )}
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm truncate">{game.name}</h3>
                <p className="text-[#a78bba] text-xs mt-1">
                  {getYear(game.first_release_date)}
                  {game.genres && ` · ${game.genres.map(g => g.name).join(", ")}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && query && (
          <p className="text-[#a78bba] text-center">No games found</p>
        )}
      </div>
    </div>
  )
}