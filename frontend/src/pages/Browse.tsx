import { useEffect, useMemo, useState } from "react"
import api from "../api"
import type { Game } from "../types"
import useTitle from "../hooks/useTitle"
import CategoryChips, { type BrowseCategory } from "../components/browse/CategoryChips"
import CoverCard from "../components/browse/CoverCard"
import FilterBar, { type BrowseSort } from "../components/browse/FilterBar"
import { CardSkeleton } from "../components/Skeleton"

const ENDPOINTS: Record<BrowseCategory, string> = {
  trending: "/games/trending",
  popular: "/games/popular",
  upcoming: "/games/upcoming",
  new: "/games/new-releases",
}

const FALLBACK_ENDPOINT = "/games/popular"

function applySort(games: Game[], sort: BrowseSort): Game[] {
  const copy = [...games]
  switch (sort) {
    case "rating":
      copy.sort(
        (a, b) =>
          (b.aggregated_rating ?? b.rating ?? 0) -
          (a.aggregated_rating ?? a.rating ?? 0),
      )
      break
    case "hype":
      copy.sort((a, b) => (b.hypes ?? 0) - (a.hypes ?? 0))
      break
    case "year-desc":
      copy.sort(
        (a, b) => (b.first_release_date ?? 0) - (a.first_release_date ?? 0),
      )
      break
    case "year-asc":
      copy.sort(
        (a, b) => (a.first_release_date ?? 0) - (b.first_release_date ?? 0),
      )
      break
    case "name":
      copy.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  return copy
}

export default function Browse() {
  useTitle("Browse")
  const [tab, setTab] = useState<BrowseCategory>("trending")
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [sort, setSort] = useState<BrowseSort>("default")
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchGames = async () => {
      try {
        const res = await api.get(ENDPOINTS[tab])
        if (cancelled) return
        if (Array.isArray(res.data) && res.data.length > 0) {
          setGames(res.data)
          return
        }
        const fb = await api.get(FALLBACK_ENDPOINT)
        if (cancelled) return
        setGames(fb.data || [])
      } catch {
        try {
          const fb = await api.get(FALLBACK_ENDPOINT)
          if (cancelled) return
          setGames(fb.data || [])
        } catch {
          if (!cancelled) setGames([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchGames()
    return () => {
      cancelled = true
    }
  }, [tab])

  const handleTabChange = (next: BrowseCategory) => {
    if (next === tab) return
    setLoading(true)
    setActiveGenre(null)
    setTab(next)
  }

  const genreFiltered = useMemo(() => {
    if (!activeGenre) return games
    return games.filter((g) => g.genres?.some((gg) => gg.name === activeGenre))
  }, [games, activeGenre])

  const sorted = useMemo(
    () => applySort(genreFiltered, sort),
    [genreFiltered, sort],
  )

  const genres = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const g of games) {
      for (const genre of g.genres || []) {
        counts[genre.name] = (counts[genre.name] || 0) + 1
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [games])

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] py-8 md:py-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)]">
            Browse games
          </h1>
          <div className="md:flex-1 md:max-w-[640px]">
            <CategoryChips value={tab} onChange={handleTabChange} />
          </div>
        </div>

        <FilterBar
          genres={genres}
          activeGenre={activeGenre}
          onGenreChange={setActiveGenre}
          totalCount={sorted.length}
          sort={sort}
          onSortChange={setSort}
        />

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="border border-dashed border-[var(--cp-border)] rounded-lg py-16 text-center">
              <div className="font-display text-2xl text-[var(--cp-text-dim)]">
                No games to show.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sorted.map((game) => {
                if (tab === "upcoming") {
                  return (
                    <CoverCard key={game.id} game={game} variant="upcoming" />
                  )
                }
                if (tab === "new") {
                  return <CoverCard key={game.id} game={game} variant="new" />
                }
                return <CoverCard key={game.id} game={game} variant="default" />
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
