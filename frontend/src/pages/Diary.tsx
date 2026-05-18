import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { DiaryEntry } from "../types"
import { ListSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"
import DiaryEntryModal from "../components/DiaryEntryModal"

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
}

const STATUS_LABEL: Record<string, string> = {
  Playing: "Playing",
  Completed: "Completed",
  "Want to Play": "Backlog",
  Dropped: "Dropped",
}

type FilterMode = "all" | "rating" | "note"

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isoDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parseDay(s: string): Date {
  const day = s.split("T")[0]
  const [y, m, d] = day.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function getCoverUrl(url: string | null) {
  if (!url) return null
  return url.startsWith("http") ? url : `https:${url}`
}

export default function Diary() {
  useTitle("Diary")
  const navigate = useNavigate()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()))
  const [filter, setFilter] = useState<FilterMode>("all")
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    api.get("/diary")
      .then((res) => {
        setEntries(res.data)
        if (res.data.length > 0) {
          const newest = res.data.reduce((max: DiaryEntry, e: DiaryEntry) =>
            new Date(e.played_at) > new Date(max.played_at) ? e : max,
          )
          setCurrentMonth(startOfMonth(parseDay(newest.played_at)))
        }
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (entryId: number) => {
    const prev = entries
    setEntries(entries.filter((e) => e.id !== entryId))
    try {
      await api.delete(`/diary/${entryId}`)
    } catch {
      setEntries(prev)
    }
  }

  const heatmap = useMemo(() => {
    const today = startOfDay(new Date())
    const todayWeekday = today.getDay()
    const end = new Date(today)
    end.setDate(end.getDate() + (6 - todayWeekday))
    const start = new Date(end)
    start.setDate(start.getDate() - 12 * 7 + 1)

    const counts: Record<string, number> = {}
    for (const e of entries) {
      const k = isoDayKey(parseDay(e.played_at))
      counts[k] = (counts[k] || 0) + 1
    }

    const weeks: { date: Date; count: number; key: string }[][] = []
    const cursor = new Date(start)
    for (let w = 0; w < 12; w++) {
      const week: { date: Date; count: number; key: string }[] = []
      for (let d = 0; d < 7; d++) {
        const dt = new Date(cursor)
        const k = isoDayKey(dt)
        week.push({ date: new Date(dt), count: counts[k] || 0, key: k })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }, [entries])

  const monthEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = parseDay(e.played_at)
      return (
        d.getFullYear() === currentMonth.getFullYear() &&
        d.getMonth() === currentMonth.getMonth()
      )
    })
  }, [entries, currentMonth])

  const filterCounts = useMemo(() => ({
    all: monthEntries.length,
    rating: monthEntries.filter((e) => e.rating).length,
    note: monthEntries.filter((e) => e.note?.trim()).length,
  }), [monthEntries])

  const filteredEntries = useMemo(() => {
    if (filter === "rating") return monthEntries.filter((e) => e.rating)
    if (filter === "note") return monthEntries.filter((e) => e.note?.trim())
    return monthEntries
  }, [monthEntries, filter])

  const byDay = useMemo(() => {
    const map: Record<string, DiaryEntry[]> = {}
    for (const e of filteredEntries) {
      const k = isoDayKey(parseDay(e.played_at))
      if (!map[k]) map[k] = []
      map[k].push(e)
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredEntries])

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-10">
        <div className="max-w-[1100px] mx-auto space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <ListSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
  const monthLongName = currentMonth.toLocaleDateString("en-US", { month: "long" })

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-[12px] text-[var(--cp-text-dim)] mb-3">
              Your diary · <span className="font-mono tabular-nums">{entries.length}</span> {entries.length === 1 ? "entry" : "entries"}
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[var(--cp-text)] leading-[1.05]">
              Diary
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center border border-[var(--cp-border)] rounded-sm overflow-hidden">
              <button
                onClick={prevMonth}
                className="px-2.5 py-1.5 text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surf)] transition"
                aria-label="Previous month"
              >
                ←
              </button>
              <span className="text-[13px] font-semibold text-[var(--cp-text)] px-3 py-1.5 min-w-[96px] text-center border-x border-[var(--cp-border)]">
                {monthLabel}
              </span>
              <button
                onClick={nextMonth}
                className="px-2.5 py-1.5 text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surf)] transition"
                aria-label="Next month"
              >
                →
              </button>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="text-[13px] font-semibold px-4 py-1.5 border border-[var(--cp-accent)]/50 text-[var(--cp-accent)] hover:bg-[var(--cp-accent)]/10 rounded-sm transition whitespace-nowrap"
            >
              + New entry
            </button>
          </div>
        </div>

        {/* Heatmap */}
        <div className="hidden md:flex items-end gap-[3px] mb-10">
          {heatmap.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, di) => {
                const intensity = cell.count === 0 ? 0 : Math.min(cell.count / 3, 1)
                const bg = cell.count === 0
                  ? "var(--cp-surf)"
                  : `rgba(233, 78, 194, ${0.18 + intensity * 0.62})`
                const label = cell.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
                return (
                  <div
                    key={di}
                    title={`${label} · ${cell.count} ${cell.count === 1 ? "entry" : "entries"}`}
                    className="w-3 h-3 rounded-[2px]"
                    style={{ backgroundColor: bg }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Filter chips */}
        {monthEntries.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" count={filterCounts.all} />
            <FilterChip active={filter === "rating"} onClick={() => setFilter("rating")} label="With rating" count={filterCounts.rating} />
            <FilterChip active={filter === "note"} onClick={() => setFilter("note")} label="With note" count={filterCounts.note} />
          </div>
        )}

        {/* Empty state */}
        {byDay.length === 0 ? (
          <div className="border border-dashed border-[var(--cp-border)] rounded-lg py-16 text-center">
            <p className="text-[13px] text-[var(--cp-text-dim)]">
              {monthEntries.length === 0
                ? `Nothing in ${monthLongName}.`
                : "No entries match this filter."}
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 inline-block text-[13px] font-medium text-[var(--cp-accent)] hover:brightness-110 transition"
            >
              Log a session →
            </button>
          </div>
        ) : (
          <div>
            {byDay.map(([dayKey, dayEntries]) => {
              const date = parseDay(dayKey)
              return (
                <div key={dayKey} className="grid md:grid-cols-[120px_1fr] gap-4 md:gap-8 mb-10 last:mb-0">
                  <div className="md:sticky md:top-4 md:self-start">
                    <div className="hidden md:block">
                      <div className="text-[13px] text-[var(--cp-text-dim)] font-medium uppercase tracking-[.04em] mb-1">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className="font-display text-[56px] leading-none text-[var(--cp-text)]">
                        {date.getDate()}
                      </div>
                      <div className="text-[12px] text-[var(--cp-text-dim)] mt-1">
                        {date.toLocaleDateString("en-US", { month: "long" })} · <span className="font-mono tabular-nums">{date.getFullYear()}</span>
                      </div>
                    </div>
                    <h3 className="md:hidden font-display text-2xl tracking-tight text-[var(--cp-text)]">
                      {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-3">
                    {dayEntries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onDelete={handleDelete}
                        onNavigate={(gid) => navigate(`/game/${gid}`)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {modalOpen && (
          <DiaryEntryModal
            onClose={() => setModalOpen(false)}
            onCreated={(entry) => {
              setEntries((prev) => [entry, ...prev])
              setCurrentMonth(startOfMonth(parseDay(entry.played_at)))
            }}
          />
        )}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-sm text-[12px] uppercase tracking-[.04em] font-semibold transition flex items-center gap-2 ${
        active
          ? "bg-[var(--cp-accent)] text-white"
          : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)]"
      }`}
    >
      {label} · {count}
    </button>
  )
}

function EntryCard({
  entry,
  onDelete,
  onNavigate,
}: {
  entry: DiaryEntry
  onDelete: (id: number) => void
  onNavigate: (gameId: number) => void
}) {
  const cover = getCoverUrl(entry.game_cover_url)
  const color = STATUS_COLORS[entry.status]
  const label = STATUS_LABEL[entry.status] || entry.status

  return (
    <div className="group relative flex gap-4 p-4 bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg hover:border-[var(--cp-accent)]/30 transition">
      <div
        onClick={() => onNavigate(entry.game_id)}
        className="cursor-pointer shrink-0"
      >
        {cover ? (
          <img
            src={cover}
            alt={entry.game_name}
            className="w-14 md:w-16 aspect-[3/4] object-cover rounded-md"
          />
        ) : (
          <div className="w-14 md:w-16 aspect-[3/4] bg-[var(--cp-surf-2)] rounded-md flex items-center justify-center p-1 font-display italic text-[11px] text-[var(--cp-text-dimmer)] text-center">
            {entry.game_name}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-8">
        <h3
          onClick={() => onNavigate(entry.game_id)}
          className="font-display text-xl tracking-tight text-[var(--cp-text)] cursor-pointer hover:text-[var(--cp-accent)] transition leading-tight"
        >
          {entry.game_name}
        </h3>

        <div className="flex gap-2.5 items-center mt-1.5 flex-wrap">
          {color && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-[3px] border uppercase tracking-[.06em] text-[12px] font-semibold"
              style={{
                background: `${color}1a`,
                borderColor: `${color}40`,
                color,
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
              />
              {label}
            </span>
          )}
          {entry.rating != null && (
            <span className="font-mono tabular-nums text-[13px] text-[#fbbf24]">
              ★ {entry.rating}/10
            </span>
          )}
        </div>

        {entry.note?.trim() && (
          <p className="font-display italic text-[15px] text-[var(--cp-text-dim)] mt-2 leading-relaxed line-clamp-3">
            {entry.note}
          </p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(entry.id)
        }}
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[var(--cp-text-dimmer)] hover:text-[var(--cp-accent)] hover:bg-[var(--cp-bg)] opacity-50 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition text-xs"
        aria-label="Delete entry"
      >
        ✕
      </button>
    </div>
  )
}
