import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { Game } from "../types"
import { getCoverUrl, getYear } from "../utils"

export default function Search() {
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
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Search Games</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Search for a game..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 rounded bg-gray-700 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Search
          </button>
        </form>

        {loading && <p className="text-gray-400">Searching...</p>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((game) => (
            <div
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
            >
              {getCoverUrl(game) ? (
                <img src={getCoverUrl(game)!} alt={game.name} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-500">No Cover</div>
              )}
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm truncate">{game.name}</h3>
                <p className="text-gray-400 text-xs mt-1">
                  {getYear(game.first_release_date)}
                  {game.genres && ` · ${game.genres.map(g => g.name).join(", ")}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && query && (
          <p className="text-gray-400 text-center">No games found</p>
        )}
      </div>
    </div>
  )
}