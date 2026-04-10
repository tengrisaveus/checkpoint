import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { Game } from "../types"
import { getCoverUrl, getYear } from "../utils"
import { CardSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"

const RECENT_KEY = "checkpoint_recent_searches"
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((q) => q !== query)
  recent.unshift(query)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

export default function Search() {
  useTitle("Search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Game[]>([])
  const [popular, setPopular] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPopular, setLoadingPopular] = useState(true)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches())
  const [hasSearched, setHasSearched] = useState(false)
  const navigate = useNavigate()

  // Fetch popular games on mount
  useEffect(() => {
    api
      .get("/games/popular")
      .then((res) => setPopular(res.data))
      .catch(() => {})
      .finally(() => setLoadingPopular(false))
  }, [])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return
    setLoading(true)
    setHasSearched(true)
    setActiveGenre(null)
    try {
      const res = await api.get("/games/search", { params: { query: q } })
      setResults(res.data)
      saveRecentSearch(q.trim())
      setRecentSearches(getRecentSearches())
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY)
    setRecentSearches([])
  }

  // Get unique genres from results for filter chips
  const allGenres = Array.from(
    new Set(results.flatMap((g) => g.genres?.map((genre) => genre.name) || []))
  ).sort()

  // Apply genre filter
  const EDITION_KEYWORDS = ["edition", "bundle", "pack", "set", "collection", "limited", "steelbook", "deluxe", "ultimate", "launch ed", "gold", "premium", "goty"]

const filteredResults = (activeGenre
  ? results.filter((g) => g.genres?.some((genre) => genre.name === activeGenre))
  : results
).filter((g) => {
  // Category filter
  if (g.category && ![0, 4, 8, 9, 10].includes(g.category)) return false
  // Edition/bundle name filter
  const lower = g.name.toLowerCase()
  return !EDITION_KEYWORDS.some((kw) => lower.includes(kw))
})

  const renderGameCard = (game: Game) => (
    <div
      key={game.id}
      onClick={() => navigate(`/game/${game.id}`)}
      className="bg-[#1a0a2e] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-fuchsia-500 transition border border-[#2d1b4e]"
    >
      {getCoverUrl(game) ? (
        <img src={getCoverUrl(game)!} alt={game.name} className="w-full h-64 object-cover" />
      ) : (
        <div className="w-full h-64 bg-[#2d1b4e] flex items-center justify-center text-[#8a6baa]">
          No Cover
        </div>
      )}
      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate">{game.name}</h3>
        <p className="text-[#a78bba] text-xs mt-1">
          {getYear(game.first_release_date)}
          {game.genres && ` · ${game.genres.map((g) => g.name).join(", ")}`}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Search Games</h1>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
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

        {/* Recent Searches */}
        {!hasSearched && recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#8a6baa] text-xs uppercase tracking-wider">Recent searches</p>
              <button onClick={clearRecent} className="text-[#8a6baa] text-xs hover:text-fuchsia-400 transition">
                Clear
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {recentSearches.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuery(q)
                    handleSearch(q)
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#1a0a2e] border border-[#2d1b4e] text-sm text-[#c4a8d8] hover:border-fuchsia-500/50 hover:text-fuchsia-400 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Genre Filter Chips */}
        {!loading && results.length > 0 && allGenres.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveGenre(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                activeGenre === null
                  ? "bg-fuchsia-500 text-white"
                  : "bg-[#1a0a2e] text-[#a78bba] border border-[#2d1b4e] hover:border-fuchsia-500/50"
              }`}
            >
              All ({results.length})
            </button>
            {allGenres.map((genre) => {
              const count = results.filter((g) =>
                g.genres?.some((gg) => gg.name === genre)
              ).length
              return (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    activeGenre === genre
                      ? "bg-fuchsia-500 text-white"
                      : "bg-[#1a0a2e] text-[#a78bba] border border-[#2d1b4e] hover:border-fuchsia-500/50"
                  }`}
                >
                  {genre} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredResults.map(renderGameCard)}
          </div>
        )}

        {!loading && results.length === 0 && hasSearched && (
          <p className="text-[#a78bba] text-center">No games found</p>
        )}

        {/* Popular Games — shown when no search yet */}
        {!hasSearched && !loading && (
          <div>
            <h2 className="text-[15px] font-medium text-white mb-3">Popular games</h2>
            {loadingPopular ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : popular.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {popular.map(renderGameCard)}
              </div>
            ) : (
              <p className="text-[#8a6baa] text-sm">Could not load popular games</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}