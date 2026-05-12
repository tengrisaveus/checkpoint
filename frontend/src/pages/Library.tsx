import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"
import { GAME_STATUSES } from "../types"
import type { LibraryEntry } from "../types"
import useTitle from "../hooks/useTitle"

const STATUS_COLORS: Record<string, string> = {
  Playing: "#3b82f6",
  Completed: "#22c55e",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
}

const STATUS_LABEL: Record<string, string> = {
  Playing: "Playing",
  Completed: "Completed",
  "Want to Play": "Backlog",
  Dropped: "Dropped",
}

type SortMode = "recent" | "rating" | "name" | "hours"
type ViewMode = "grid" | "table" | "columns"

interface LibraryEntryWithGame extends LibraryEntry {
  game_name: string
  game_cover_url: string | null
  hours_played?: number | null
  release_year?: number | null
  developer?: string | null
}

function getCoverUrl(url: string | null) {
  if (!url) return null
  return url.startsWith("http") ? url : `https:${url}`
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
}

function monthLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()
}

function fallbackGradient(gameId: number): string {
  const palettes = [
    "linear-gradient(165deg,#5a1a3a,#1a0a2e)",
    "linear-gradient(160deg,#2a1a5a,#5a1a3a)",
    "linear-gradient(180deg,#4c1d95,#831843)",
    "linear-gradient(200deg,#1e3a8a,#4c1d95)",
    "linear-gradient(175deg,#6b21a8,#312e81)",
    "linear-gradient(195deg,#831843,#4c1d95)",
  ]
  return palettes[gameId % palettes.length]
}

export default function Library() {
  useTitle("My Library")
  const navigate = useNavigate()
  const [entries, setEntries] = useState<LibraryEntryWithGame[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [query, setQuery] = useState("")
  const [sortMode, setSortMode] = useState<SortMode>("recent")
  const [view, setView] = useState<ViewMode>("grid")

  useEffect(() => {
    api.get("/library")
      .then((res) => setEntries(res.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const total = entries.length
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of entries) c[e.status] = (c[e.status] || 0) + 1
    return c
  }, [entries])

  const filtered = useMemo(() => {
    let list = entries
    if (statusFilter) list = list.filter((e) => e.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((e) => e.game_name.toLowerCase().includes(q))
    }
    const copy = [...list]
    if (sortMode === "recent") {
      copy.sort((a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      )
    } else if (sortMode === "rating") {
      copy.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortMode === "name") {
      copy.sort((a, b) => a.game_name.localeCompare(b.game_name))
    } else if (sortMode === "hours") {
      copy.sort((a, b) => (b.hours_played || 0) - (a.hours_played || 0))
    }
    return copy
  }, [entries, statusFilter, query, sortMode])

  const grouped = useMemo(() => {
    if (sortMode !== "recent") return [{ key: "all", label: null, items: filtered }]
    const groups: { key: string; label: string; items: LibraryEntryWithGame[] }[] = []
    const byKey: Record<string, { label: string; items: LibraryEntryWithGame[] }> = {}
    for (const e of filtered) {
      const iso = e.updated_at || e.created_at
      const k = monthKey(iso)
      if (!byKey[k]) {
        byKey[k] = { label: monthLabel(iso), items: [] }
        groups.push({ key: k, label: byKey[k].label, items: byKey[k].items })
      }
      byKey[k].items.push(e)
    }
    return groups
  }, [filtered, sortMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="h-6 w-40 bg-[var(--cp-surf)] rounded mb-3 animate-pulse" />
          <div className="h-10 w-80 bg-[var(--cp-surf)] rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[var(--cp-surf)] rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const showEmpty = filtered.length === 0

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] py-8 md:py-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="font-mono uppercase tracking-wider text-[11px] text-[var(--cp-text-dimmer)] mb-3">
              YOUR LIBRARY · {total} {total === 1 ? "GAME" : "GAMES"}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            {([
              { mode: "grid", icon: "⊞", label: "Grid", enabled: true },
              { mode: "table", icon: "≡", label: "Table", enabled: false },
              { mode: "columns", icon: "▦", label: "Columns", enabled: false },
            ] as { mode: ViewMode; icon: string; label: string; enabled: boolean }[]).map((v) => {
              const active = view === v.mode
              return (
                <button
                  key={v.mode}
                  onClick={() => v.enabled && setView(v.mode)}
                  disabled={!v.enabled}
                  title={v.enabled ? v.label : "Coming soon"}
                  className={`font-mono uppercase tracking-wider text-[11px] px-3 py-2 rounded-sm border transition flex items-center gap-1.5 ${
                    active
                      ? "border-[var(--cp-accent)]/50 bg-[var(--cp-accent)]/10 text-[var(--cp-accent)]"
                      : v.enabled
                        ? "border-[var(--cp-border)] text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/40 hover:text-[var(--cp-text)]"
                        : "border-[var(--cp-border)] text-[var(--cp-text-dimmer)] opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span className="text-[13px] leading-none">{v.icon}</span>
                  <span>{v.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto flex-nowrap pb-1">
          <button
            onClick={() => setStatusFilter("")}
            className={`shrink-0 px-3 py-1.5 rounded-sm font-mono uppercase tracking-wider text-[11px] transition flex items-center gap-2 ${
              statusFilter === ""
                ? "bg-[var(--cp-accent)] text-white"
                : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)]"
            }`}
          >
            All · {total}
          </button>
          {GAME_STATUSES.map((s) => {
            const active = statusFilter === s
            const count = statusCounts[s] || 0
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-sm font-mono uppercase tracking-wider text-[11px] transition flex items-center gap-2 ${
                  active
                    ? "bg-[var(--cp-accent)] text-white"
                    : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)]"
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s] }}
                />
                {STATUS_LABEL[s]} · {count}
              </button>
            )
          })}
          <div className="flex-1" />
          <input
            type="text"
            placeholder="Filter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="shrink-0 w-[160px] bg-transparent text-sm text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] border border-[var(--cp-border)] rounded-sm px-3 py-1.5 outline-none focus:border-[var(--cp-accent)]/50 transition"
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="shrink-0 font-mono text-[11px] uppercase tracking-wider bg-transparent text-[var(--cp-text-dim)] border border-[var(--cp-border)] rounded-sm px-3 py-1.5 outline-none hover:border-[var(--cp-accent)]/40 transition"
          >
            <option value="recent">Recent</option>
            <option value="rating">Rating</option>
            <option value="name">A–Z</option>
            <option value="hours">Hours</option>
          </select>
        </div>

        {showEmpty ? (
          <div className="border border-dashed border-[var(--cp-border)] rounded-lg py-16 text-center">
            <div className="font-display italic text-2xl text-[var(--cp-text-dim)]">
              {entries.length === 0 ? "Nothing here yet." : "No games match these filters."}
            </div>
            <Link
              to="/search"
              className="mt-4 inline-block font-mono uppercase tracking-wider text-[11px] text-[var(--cp-accent)] hover:brightness-110 transition"
            >
              Add your first game →
            </Link>
          </div>
        ) : (
          <div>
            {grouped.map((group) => (
              <div key={group.key}>
                {group.label && (
                  <div className="font-mono text-[10px] tracking-[.1em] uppercase text-[var(--cp-text-dimmer)] mb-3.5 mt-6 first:mt-0">
                    {group.label}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3.5">
                  {group.items.map((entry) => {
                    const cover = getCoverUrl(entry.game_cover_url)
                    const dateIso = entry.updated_at || entry.created_at
                    const meta = entry.hours_played && entry.hours_played > 0
                      ? `${entry.hours_played}H · ${shortDate(dateIso)}`
                      : shortDate(dateIso)
                    return (
                      <div
                        key={entry.id}
                        onClick={() => navigate(`/game/${entry.game_id}`)}
                        className="group relative cursor-pointer"
                      >
                        <div
                          className="relative w-full aspect-[3/4] rounded overflow-hidden transition-transform duration-200 group-hover:scale-[1.03]"
                          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
                        >
                          {cover ? (
                            <img
                              src={cover}
                              alt={entry.game_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center p-2 text-center font-display italic text-[var(--cp-text-dim)] text-xs"
                              style={{ background: fallbackGradient(entry.game_id) }}
                            >
                              {entry.game_name}
                            </div>
                          )}

                          <div
                            className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-[3px] backdrop-blur-md flex items-center gap-1 font-mono uppercase tracking-wider text-[9px]"
                            style={{
                              backgroundColor: "rgba(10,6,16,0.7)",
                              color: STATUS_COLORS[entry.status] || "#9a8eb0",
                            }}
                          >
                            <span
                              className="inline-block w-[5px] h-[5px] rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[entry.status] || "#6b7280" }}
                            />
                            {STATUS_LABEL[entry.status] || entry.status}
                          </div>

                          {entry.rating != null && (
                            <div
                              className="absolute bottom-1.5 right-1.5 px-1.5 py-[2px] rounded-[3px] backdrop-blur-md font-mono text-[10px] font-semibold"
                              style={{
                                backgroundColor: "rgba(10,6,16,0.8)",
                                color: "#fbbf24",
                              }}
                            >
                              ★ {entry.rating}
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 text-[11.5px] font-medium leading-tight text-[var(--cp-text)] group-hover:text-[var(--cp-accent)] transition truncate">
                          {entry.game_name}
                        </div>
                        <div className="mt-0.5 font-mono text-[9.5px] tracking-wider text-[var(--cp-text-dimmer)]">
                          {meta}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
