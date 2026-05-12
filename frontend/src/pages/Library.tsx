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

type SortMode = "recent" | "rating" | "name" | "hours" | "status"
type ViewMode = "grid" | "table" | "columns"

interface LibraryEntryWithGame extends LibraryEntry {
  game_name: string
  game_cover_url: string | null
  hours_played?: number | null
  release_year?: number | null
  developer?: string | null
  genre?: string | null
}

const VIEW_KEY = "library-view"

function readView(): ViewMode {
  const v = localStorage.getItem(VIEW_KEY)
  if (v === "grid" || v === "table" || v === "columns") return v
  return "grid"
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

function StatusChip({
  status,
  onChange,
}: {
  status: string
  onChange?: (next: string) => void
}) {
  const color = STATUS_COLORS[status] || "#9a8eb0"
  const label = STATUS_LABEL[status] || status
  const interactive = !!onChange
  return (
    <div className="relative inline-flex">
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[3px] border font-mono uppercase tracking-[.06em] text-[11.5px] font-medium"
        style={{
          backgroundColor: `${color}1a`,
          borderColor: `${color}40`,
          color,
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
      {interactive && (
        <select
          value={status}
          onChange={(e) => onChange!(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Change status"
        >
          {GAME_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function SortHeader({
  label,
  field,
  current,
  onClick,
  align = "left",
}: {
  label: string
  field: SortMode
  current: SortMode
  onClick: (next: SortMode) => void
  align?: "left" | "right"
}) {
  const active = current === field
  return (
    <button
      onClick={() => onClick(field)}
      className={`font-mono uppercase tracking-[.08em] text-[12px] transition flex items-center gap-1 ${
        align === "right" ? "justify-end" : "justify-start"
      } ${active ? "text-[var(--cp-text)]" : "text-[var(--cp-text-dim)] hover:text-[var(--cp-text)]"}`}
    >
      {label}
      {active && <span className="text-[10px]">↓</span>}
    </button>
  )
}

export default function Library() {
  useTitle("My Library")
  const navigate = useNavigate()
  const [entries, setEntries] = useState<LibraryEntryWithGame[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [query, setQuery] = useState("")
  const [sortMode, setSortMode] = useState<SortMode>("recent")
  const [view, setView] = useState<ViewMode>(readView)

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view)
  }, [view])

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
    const statusOrder = ["Playing", "Completed", "Want to Play", "Dropped"]
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
    } else if (sortMode === "status") {
      copy.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
    }
    return copy
  }, [entries, statusFilter, query, sortMode])

  const grouped = useMemo(() => {
    if (sortMode !== "recent" || view !== "grid") {
      return [{ key: "all", label: null, items: filtered }]
    }
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
  }, [filtered, sortMode, view])

  const handleUpdateStatus = async (entryId: number, nextStatus: string) => {
    const prev = entries
    setEntries(entries.map((e) => (e.id === entryId ? { ...e, status: nextStatus } : e)))
    try {
      const target = entries.find((e) => e.id === entryId)
      if (!target) return
      await api.put(`/library/${target.game_id}`, {
        status: nextStatus,
        rating: target.rating,
        review: target.review || null,
      })
    } catch {
      setEntries(prev)
    }
  }

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
  const effectiveView: ViewMode =
    view === "table" && typeof window !== "undefined" && window.innerWidth < 768
      ? "grid"
      : view

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] py-8 md:py-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="font-mono uppercase tracking-[.08em] text-[12px] text-[var(--cp-text-dim)] mb-3">
              YOUR LIBRARY · {total}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            {([
              { mode: "grid", icon: "⊞", label: "Grid" },
              { mode: "table", icon: "≡", label: "Table" },
              { mode: "columns", icon: "▦", label: "Columns" },
            ] as { mode: ViewMode; icon: string; label: string }[]).map((v) => {
              const active = view === v.mode
              return (
                <button
                  key={v.mode}
                  onClick={() => setView(v.mode)}
                  title={v.label}
                  className={`font-mono uppercase tracking-[.08em] text-[12px] px-3 py-2 rounded-sm border transition flex items-center gap-1.5 ${
                    active
                      ? "border-[var(--cp-accent)]/50 bg-[var(--cp-surf)] text-[var(--cp-text)]"
                      : "border-[var(--cp-border)] text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/40 hover:text-[var(--cp-text)]"
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
            className={`shrink-0 px-3 py-1.5 rounded-sm font-mono uppercase tracking-[.06em] text-[11.5px] transition flex items-center gap-2 ${
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
                className={`shrink-0 px-3 py-1.5 rounded-sm font-mono uppercase tracking-[.06em] text-[11.5px] transition flex items-center gap-2 ${
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
          {effectiveView !== "columns" && (
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="shrink-0 font-mono text-[11.5px] uppercase tracking-[.06em] bg-transparent text-[var(--cp-text-dim)] border border-[var(--cp-border)] rounded-sm px-3 py-1.5 outline-none hover:border-[var(--cp-accent)]/40 transition"
            >
              <option value="recent">Recent</option>
              <option value="rating">Rating</option>
              <option value="name">A–Z</option>
              <option value="hours">Hours</option>
              <option value="status">Status</option>
            </select>
          )}
        </div>

        {showEmpty ? (
          <div className="border border-dashed border-[var(--cp-border)] rounded-lg py-16 text-center">
            <div className="font-display italic text-2xl text-[var(--cp-text-dim)]">
              {entries.length === 0 ? "Nothing here yet." : "No games match these filters."}
            </div>
            <Link
              to="/search"
              className="mt-4 inline-block font-mono uppercase tracking-[.08em] text-[11.5px] text-[var(--cp-accent)] hover:brightness-110 transition"
            >
              Add your first game →
            </Link>
          </div>
        ) : effectiveView === "grid" ? (
          <GridView
            grouped={grouped}
            onNavigate={(gid) => navigate(`/game/${gid}`)}
          />
        ) : effectiveView === "table" ? (
          <TableView
            items={filtered}
            sortMode={sortMode}
            onSort={setSortMode}
            onNavigate={(gid) => navigate(`/game/${gid}`)}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <ColumnsView
            items={filtered}
            onNavigate={(gid) => navigate(`/game/${gid}`)}
            onAdd={() => navigate("/search")}
          />
        )}
      </div>
    </div>
  )
}

function GridView({
  grouped,
  onNavigate,
}: {
  grouped: { key: string; label: string | null; items: LibraryEntryWithGame[] }[]
  onNavigate: (gameId: number) => void
}) {
  return (
    <div>
      {grouped.map((group) => (
        <div key={group.key}>
          {group.label && (
            <div className="font-mono text-[12px] tracking-[.08em] uppercase text-[var(--cp-text-dim)] mb-3.5 mt-6 first:mt-0">
              {group.label}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3.5">
            {group.items.map((entry) => {
              const cover = getCoverUrl(entry.game_cover_url)
              const dateIso = entry.updated_at || entry.created_at
              const meta = entry.hours_played && entry.hours_played > 0
                ? `${entry.hours_played}h · ${new Date(dateIso).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : new Date(dateIso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              return (
                <div
                  key={entry.id}
                  onClick={() => onNavigate(entry.game_id)}
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
                      className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-[3px] backdrop-blur-md flex items-center gap-1 font-mono uppercase tracking-normal text-[10.5px] font-medium"
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
                        className="absolute bottom-1.5 right-1.5 px-1.5 py-[2px] rounded-[3px] backdrop-blur-md font-mono text-[11.5px] font-semibold"
                        style={{
                          backgroundColor: "rgba(10,6,16,0.8)",
                          color: "#fbbf24",
                        }}
                      >
                        ★ {entry.rating}
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 text-[13.5px] font-medium leading-tight text-[var(--cp-text)] group-hover:text-[var(--cp-accent)] transition truncate">
                    {entry.game_name}
                  </div>
                  <div className="mt-0.5 font-mono text-[11.5px] text-[var(--cp-text-dim)]">
                    {meta}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TableView({
  items,
  sortMode,
  onSort,
  onNavigate,
  onUpdateStatus,
}: {
  items: LibraryEntryWithGame[]
  sortMode: SortMode
  onSort: (next: SortMode) => void
  onNavigate: (gameId: number) => void
  onUpdateStatus: (entryId: number, status: string) => void
}) {
  const gridCols = "grid-cols-[56px_minmax(0,1fr)_140px_90px_100px_90px]"
  return (
    <div className="border border-[var(--cp-border)] rounded-md overflow-hidden">
      <div
        className={`grid ${gridCols} px-4 py-2.5 bg-[var(--cp-surf)] border-b border-[var(--cp-border)] gap-3.5 items-center`}
      >
        <div />
        <SortHeader label="GAME" field="name" current={sortMode} onClick={onSort} />
        <SortHeader label="STATUS" field="status" current={sortMode} onClick={onSort} />
        <SortHeader label="RATING" field="rating" current={sortMode} onClick={onSort} />
        <SortHeader label="HOURS" field="hours" current={sortMode} onClick={onSort} />
        <SortHeader label="UPDATED" field="recent" current={sortMode} onClick={onSort} />
      </div>

      {items.map((entry, idx) => {
        const cover = getCoverUrl(entry.game_cover_url)
        const altBg = idx % 2 === 1 ? "bg-[rgba(20,11,31,0.4)]" : ""
        const dateIso = entry.updated_at || entry.created_at
        const sub = [entry.developer || entry.genre, entry.release_year].filter(Boolean).join(" · ")
        return (
          <div
            key={entry.id}
            onClick={() => onNavigate(entry.game_id)}
            className={`grid ${gridCols} px-4 py-2.5 border-b border-[var(--cp-border)] last:border-b-0 gap-3.5 items-center cursor-pointer hover:bg-[var(--cp-surf)] transition ${altBg}`}
          >
            <div className="w-10 aspect-[3/4] rounded overflow-hidden">
              {cover ? (
                <img src={cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: fallbackGradient(entry.game_id) }}
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-[var(--cp-text)] truncate">
                {entry.game_name}
              </div>
              {sub && (
                <div className="mt-0.5 font-mono text-[11px] tracking-[.06em] text-[var(--cp-text-dim)] truncate">
                  {sub}
                </div>
              )}
            </div>
            <div>
              <StatusChip
                status={entry.status}
                onChange={(s) => onUpdateStatus(entry.id, s)}
              />
            </div>
            <div
              className="font-mono text-[12.5px]"
              style={{ color: entry.rating != null ? "#fbbf24" : "var(--cp-text-dimmer)" }}
            >
              {entry.rating != null ? `★ ${entry.rating}/10` : "—"}
            </div>
            <div className="font-mono text-[12.5px] text-[var(--cp-text-dim)]">
              {entry.hours_played && entry.hours_played > 0 ? `${entry.hours_played}h` : "—"}
            </div>
            <div className="font-mono text-[11.5px] tracking-[.06em] text-[var(--cp-text-dim)]">
              {shortDate(dateIso)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ColumnsView({
  items,
  onNavigate,
  onAdd,
}: {
  items: LibraryEntryWithGame[]
  onNavigate: (gameId: number) => void
  onAdd: () => void
}) {
  const grouped = useMemo(() => {
    const out: Record<string, LibraryEntryWithGame[]> = {
      Playing: [],
      Completed: [],
      "Want to Play": [],
      Dropped: [],
    }
    for (const e of items) {
      if (out[e.status]) out[e.status].push(e)
    }
    for (const k of Object.keys(out)) {
      out[k].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      )
    }
    return out
  }, [items])

  const cols: { key: string; label: string }[] = [
    { key: "Playing", label: "PLAYING" },
    { key: "Completed", label: "COMPLETED" },
    { key: "Want to Play", label: "BACKLOG" },
    { key: "Dropped", label: "DROPPED" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cols.map((col) => {
        const color = STATUS_COLORS[col.key]
        const all = grouped[col.key] || []
        const entries = all.slice(0, 50)
        return (
          <div
            key={col.key}
            className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg overflow-hidden flex flex-col"
          >
            <div
              className="px-3.5 py-3 border-b border-[var(--cp-border)] flex justify-between items-center"
              style={{ background: `linear-gradient(180deg, ${color}10, transparent)` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span
                  className="font-mono text-[12px] uppercase tracking-[.08em] font-medium"
                  style={{ color }}
                >
                  {col.label}
                </span>
              </div>
              <span className="font-mono text-[12px] text-[var(--cp-text-dim)]">
                {all.length}
              </span>
            </div>
            <div className="p-2.5 flex flex-col gap-2 min-h-[400px]">
              {entries.length === 0 && (
                <div className="font-display italic text-[var(--cp-text-dimmer)] text-sm py-4 text-center">
                  Nothing here.
                </div>
              )}
              {entries.map((entry) => (
                <ColumnCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => onNavigate(entry.game_id)}
                />
              ))}
              <button
                onClick={onAdd}
                className="mt-auto w-full py-2.5 border border-dashed border-[var(--cp-border)] rounded-[5px] text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/40 hover:text-[var(--cp-accent)] transition font-mono text-[11.5px] uppercase tracking-[.06em]"
              >
                + Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ColumnCard({
  entry,
  onClick,
}: {
  entry: LibraryEntryWithGame
  onClick: () => void
}) {
  const cover = getCoverUrl(entry.game_cover_url)
  let meta: { text: string; color: string }
  if (entry.rating != null) {
    meta = { text: `★ ${entry.rating}/10`, color: "#fbbf24" }
  } else if (entry.hours_played && entry.hours_played > 0) {
    meta = { text: `${entry.hours_played}h played`, color: "var(--cp-text-dim)" }
  } else {
    meta = { text: "Not started", color: "var(--cp-text-dimmer)" }
  }
  return (
    <div
      onClick={onClick}
      className="flex gap-2.5 p-2 bg-[var(--cp-bg)] rounded-[5px] items-center border border-[var(--cp-border)]/40 cursor-pointer hover:border-[var(--cp-accent)]/40 transition"
    >
      <div className="w-9 aspect-[3/4] rounded overflow-hidden shrink-0">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: fallbackGradient(entry.game_id) }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-[var(--cp-text)] truncate">
          {entry.game_name}
        </div>
        <div
          className="mt-0.5 font-mono text-[11px] tracking-[.06em] truncate"
          style={{ color: meta.color }}
        >
          {meta.text}
        </div>
      </div>
    </div>
  )
}
