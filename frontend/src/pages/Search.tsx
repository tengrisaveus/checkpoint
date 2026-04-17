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

  useEffect(() => {
    api
      .get("/games/new-releases")
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

  const allGenres = Array.from(
    new Set(results.flatMap((g) => g.genres?.map((genre) => genre.name) || []))
  ).sort()

  const EDITION_KEYWORDS = ["edition", "bundle", "pack", "set", "collection", "limited", "steelbook", "deluxe", "ultimate", "launch ed", "gold", "premium", "goty"]

  const filteredResults = (activeGenre
    ? results.filter((g) => g.genres?.some((genre) => genre.name === activeGenre))
    : results
  ).filter((g) => {
    if (g.category && ![0, 4, 8, 9, 10].includes(g.category)) return false
    const lower = g.name.toLowerCase()
    return !EDITION_KEYWORDS.some((kw) => lower.includes(kw))
  })

  const renderGameCard = (game: Game) => (
    <div
      key={game.id}
      onClick={() => navigate(`/game/${game.id}`)}
      className="bg-[var(--cp-surf)] rounded-md overflow-hidden cursor-pointer border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/30 transition group"
    >
      {getCoverUrl(game) ? (
        <img src={getCoverUrl(game)!} alt={game.name} className="w-full h-64 object-cover cover-hover" />
      ) : (
        <div className="w-full h-64 bg-[var(--cp-surf-2)] flex items-center justify-center text-[var(--cp-text-dimmer)] cover-placeholder italic">
          {game.name}
        </div>
      )}
      <div className="p-3">
        <h3 className="text-[var(--cp-text)] font-semibold text-sm truncate">{game.name}</h3>
        <p className="font-mono text-[var(--cp-text-dim)] text-xs mt-1">
          {getYear(game.first_release_date)}
          {game.genres && ` · ${game.genres.map((g) => g.name).join(", ")}`}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      <div className="max-w-[1440px] mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)] mb-6">Search Games</h1>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search for a game..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition"
          >
            Search
          </button>
        </form>

        {/* Recent Searches */}
        {!hasSearched && recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider">Recent searches</p>
              <button onClick={clearRecent} className="text-[var(--cp-text-dimmer)] text-xs hover:text-[var(--cp-accent)] transition">
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
                  className="px-3 py-1.5 rounded-sm bg-[var(--cp-surf)] border border-[var(--cp-border)] text-sm text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-accent)] transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Genre Filter Chips */}
        {!loading && results.length > 0 && allGenres.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveGenre(null)}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition ${
                activeGenre === null
                  ? "bg-[var(--cp-accent)] text-white"
                  : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50"
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
                  className={`px-3 py-1 rounded-sm text-xs font-medium transition ${
                    activeGenre === genre
                      ? "bg-[var(--cp-accent)] text-white"
                      : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredResults.map(renderGameCard)}
          </div>
        )}

        {!loading && results.length === 0 && hasSearched && (
          <p className="text-[var(--cp-text-dim)] text-center font-display text-xl italic mt-12">No games found</p>
        )}

        {/* New Releases — shown when no search yet */}
        {!hasSearched && !loading && (
          <div>
            <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">NEW RELEASES</p>
            {loadingPopular ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : popular.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {popular.map(renderGameCard)}
              </div>
            ) : (
              <p className="text-[var(--cp-text-dimmer)] text-sm">Could not load new releases</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
