import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import api from "../api"
import type { Game } from "../types"
import { getCoverUrl, getYear } from "../utils"

const RECENT_KEY = "checkpoint_recent_searches"
const MAX_RECENT = 5
const DEBOUNCE_MS = 200

const EDITION_KEYWORDS = [
  "edition", "bundle", "pack", "set", "collection", "limited",
  "steelbook", "deluxe", "ultimate", "launch ed", "gold", "premium", "goty",
]

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

function filterGames(games: Game[]): Game[] {
  return games.filter((g) => {
    if (g.category && ![0, 4, 8, 9, 10].includes(g.category)) return false
    const lower = g.name.toLowerCase()
    return !EDITION_KEYWORDS.some((kw) => lower.includes(kw))
  })
}

function highlightMatch(name: string, query: string): ReactNode {
  if (!query.trim()) return name
  const lowerName = name.toLowerCase()
  const lowerQ = query.toLowerCase()
  const parts: ReactNode[] = []
  let i = 0
  while (i < name.length) {
    const idx = lowerName.indexOf(lowerQ, i)
    if (idx === -1) {
      parts.push(name.slice(i))
      break
    }
    if (idx > i) parts.push(name.slice(i, idx))
    parts.push(
      <mark
        key={idx}
        className="bg-[var(--cp-accent)]/30 text-[var(--cp-text)] rounded-[2px] px-0.5"
      >
        {name.slice(idx, idx + query.length)}
      </mark>
    )
    i = idx + query.length
  }
  return parts
}

function getDeveloper(game: Game): string | null {
  const c = game.involved_companies?.[0]?.company?.name
  return c || null
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="px-2 py-1 bg-[var(--cp-bg)] border border-[var(--cp-border)] rounded-[3px] mr-1 font-mono text-[12px] text-[var(--cp-text-dim)] leading-none">
      {children}
    </kbd>
  )
}

function ResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2.5 py-2 animate-pulse">
      <div className="w-9 aspect-[3/4] bg-[var(--cp-surf-2)] rounded" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-[var(--cp-surf-2)] rounded w-1/2" />
        <div className="h-2.5 bg-[var(--cp-surf-2)] rounded w-1/3" />
      </div>
    </div>
  )
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [recent, setRecent] = useState<string[]>(getRecentSearches())

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelectedIdx(0)
  }, [query, results.length])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const controller = new AbortController()
    const t = setTimeout(() => {
      api.get("/games/search", { params: { query: q }, signal: controller.signal })
        .then((res) => {
          setResults(filterGames(res.data))
        })
        .catch((err) => {
          if (!axios.isCancel(err) && err?.name !== "CanceledError") {
            setResults([])
          }
        })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query])

  const filteredResults = useMemo(() => results, [results])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selectedIdx}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIdx])

  const handleSelect = (game: Game) => {
    saveRecentSearch(query.trim() || game.name)
    setRecent(getRecentSearches())
    navigate(`/game/${game.id}`)
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (filteredResults.length === 0) return
      setSelectedIdx((i) => Math.min(filteredResults.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (filteredResults.length === 0) return
      setSelectedIdx((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const g = filteredResults[selectedIdx]
      if (g) handleSelect(g)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search games"
      onClick={onClose}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 150ms ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[720px] max-w-[92vw] bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-[10px] overflow-hidden"
        style={{
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 4px rgba(233,78,194,0.08)",
          transform: mounted ? "translateY(0)" : "translateY(8px)",
          opacity: mounted ? 1 : 0,
          transition: "transform 150ms ease, opacity 150ms ease",
        }}
      >
        <div className="flex items-center gap-3 px-[18px] py-[14px] border-b border-[var(--cp-border)]">
          <span className="text-[var(--cp-text-dimmer)] text-lg leading-none">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, developers, genres…"
            className="flex-1 bg-transparent border-none outline-none text-[var(--cp-text)] text-[17px] placeholder:text-[var(--cp-text-dimmer)]"
          />
          {filteredResults.length > 0 && (
            <span className="hidden sm:inline-flex items-center text-[12px] text-[var(--cp-text-dim)]">
              <Kbd>↵</Kbd>
            </span>
          )}
        </div>

        <div ref={listRef} className="p-2 max-h-[400px] overflow-y-auto">
          {!query.trim() ? (
            recent.length > 0 ? (
              <div className="px-3 py-3">
                <div className="text-[13px] text-[var(--cp-text-dim)] font-medium mb-2">
                  Recent
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.slice(0, 5).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuery(q)}
                      className="px-2.5 py-1 rounded-[3px] bg-[var(--cp-surf-2)] border border-[var(--cp-border)] text-[12px] text-[var(--cp-text-dim)] hover:text-[var(--cp-accent)] hover:border-[var(--cp-accent)]/40 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-[13px] text-[var(--cp-text-dimmer)]">
                Start typing to search games, developers, or genres.
              </div>
            )
          ) : loading ? (
            <div>
              <div className="text-[13px] text-[var(--cp-text-dim)] font-medium px-3 py-1.5">
                Searching…
              </div>
              <ResultSkeleton />
              <ResultSkeleton />
              <ResultSkeleton />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="font-display italic text-[var(--cp-text-dim)] text-xl">
                No matches for “{query}”
              </div>
              <div className="text-[13px] text-[var(--cp-text-dim)] mt-2">
                Try a different keyword
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[13px] text-[var(--cp-text-dim)] font-medium px-3 py-1.5">
                Results · {filteredResults.length}
              </div>
              {filteredResults.map((game, i) => {
                const cover = getCoverUrl(game)
                const dev = getDeveloper(game)
                const year = getYear(game.first_release_date)
                const sub = [dev, year].filter(Boolean).join(" · ") ||
                  game.genres?.map((g) => g.name).join(", ") ||
                  ""
                const active = i === selectedIdx
                return (
                  <div
                    key={game.id}
                    data-idx={i}
                    onMouseEnter={() => setSelectedIdx(i)}
                    onClick={() => handleSelect(game)}
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer border ${
                      active
                        ? "bg-[var(--cp-accent)]/[.12] border-[var(--cp-accent)]/40"
                        : "border-transparent"
                    }`}
                  >
                    <div className="w-9 aspect-[3/4] rounded overflow-hidden bg-[var(--cp-surf-2)] flex-shrink-0">
                      {cover ? (
                        <img src={cover} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-display italic text-[9px] text-[var(--cp-text-dimmer)] text-center p-0.5">
                          {game.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--cp-text)] truncate">
                        {highlightMatch(game.name, query)}
                      </div>
                      {sub && (
                        <div className="text-[12px] text-[var(--cp-text-dim)] truncate">
                          {sub}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--cp-border)] px-3.5 py-2.5 flex justify-end items-center text-[12px] text-[var(--cp-text-dim)]">
          <span className="flex items-center"><Kbd>esc</Kbd> close</span>
        </div>
      </div>
    </div>
  )
}
