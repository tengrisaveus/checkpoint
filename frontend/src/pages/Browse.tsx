import { useEffect, useMemo, useState } from "react"
import api from "../api"
import type { Game } from "../types"
import useTitle from "../hooks/useTitle"
import CategoryChips, { type BrowseCategory } from "../components/browse/CategoryChips"
import CoverCard from "../components/browse/CoverCard"
import FilterBar, { type BrowseSort } from "../components/browse/FilterBar"
import TrendingHero from "../components/browse/heroes/TrendingHero"
import UpcomingHero from "../components/browse/heroes/UpcomingHero"
import TopRatedHero from "../components/browse/heroes/TopRatedHero"
import { CardSkeleton } from "../components/Skeleton"

const PAGE_SIZE = 12
const HERO_KEY = "browse-hero"

const ENDPOINTS: Record<BrowseCategory, string> = {
  trending: "/games/trending",
  popular: "/games/popular",
  upcoming: "/games/upcoming",
  new: "/games/new-releases",
  top: "/games/top-rated",
  gems: "/games/hidden-gems",
}

const FALLBACK_ENDPOINT = "/games/popular"

function readHero(): boolean {
  const v = localStorage.getItem(HERO_KEY)
  return v == null ? true : v === "1"
}

function applySort(games: Game[], sort: BrowseSort, tab: BrowseCategory): Game[] {
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
    case "default":
    default:
      if (tab === "top" || tab === "gems") {
        copy.sort(
          (a, b) =>
            (b.aggregated_rating ?? b.rating ?? 0) -
            (a.aggregated_rating ?? a.rating ?? 0),
        )
      }
      break
  }
  return copy
}

export default function Browse() {
  useTitle("Browse")
  const [tab, setTab] = useState<BrowseCategory>("trending")
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [sort, setSort] = useState<BrowseSort>("default")
  const [showHero, setShowHero] = useState<boolean>(readHero)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    localStorage.setItem(HERO_KEY, showHero ? "1" : "0")
  }, [showHero])

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
    setVisible(PAGE_SIZE)
    setActiveGenre(null)
    setTab(next)
  }

  const genreFiltered = useMemo(() => {
    if (!activeGenre) return games
    return games.filter((g) => g.genres?.some((gg) => gg.name === activeGenre))
  }, [games, activeGenre])

  const sorted = useMemo(
    () => applySort(genreFiltered, sort, tab),
    [genreFiltered, sort, tab],
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

  const paged = sorted.slice(0, visible)

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] py-8 md:py-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)]">
            Browse games
          </h1>
          <button
            onClick={() => setShowHero((v) => !v)}
            className={`shrink-0 text-[12px] font-semibold uppercase tracking-[.04em] px-3 py-1.5 rounded-sm border transition ${
              showHero
                ? "border-[var(--cp-accent)]/50 bg-[var(--cp-surf)] text-[var(--cp-text)]"
                : "border-[var(--cp-border)] text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/40 hover:text-[var(--cp-text)]"
            }`}
          >
            Featured
          </button>
        </div>

        <div className="mb-6">
          <CategoryChips value={tab} onChange={handleTabChange} />
        </div>

        {!loading && showHero && tab === "trending" && (
          <TrendingHero games={games} />
        )}
        {!loading && showHero && tab === "upcoming" && (
          <UpcomingHero games={games} />
        )}
        {!loading && showHero && tab === "top" && (
          <TopRatedHero games={applySort(games, "rating", "top")} />
        )}

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
              {Array.from({ length: 12 }).map((_, i) => (
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
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {paged.map((game, i) => {
                  if (tab === "top") {
                    return (
                      <CoverCard
                        key={game.id}
                        game={game}
                        variant="ranked"
                        rank={i + 1}
                      />
                    )
                  }
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
              {visible < sorted.length && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="text-[12px] font-semibold uppercase tracking-[.04em] px-4 py-2 rounded-sm border border-[var(--cp-border)] text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)] transition"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
