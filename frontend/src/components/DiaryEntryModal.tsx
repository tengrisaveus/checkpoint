import { useState, useEffect, useRef } from "react"
import api from "../api"
import type { DiaryEntry } from "../types"

interface IGDBGame {
  id: number
  name: string
  cover?: { url: string } | null
  first_release_date?: number | null
}

interface Props {
  onClose: () => void
  onCreated: (entry: DiaryEntry) => void
}

const STATUSES = ["Playing", "Completed", "Want to Play", "Dropped"] as const

export default function DiaryEntryModal({ onClose, onCreated }: Props) {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<IGDBGame[]>([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<IGDBGame | null>(null)
  const [status, setStatus] = useState<string>("Completed")
  const [playedAt, setPlayedAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount, and handle Escape to close
  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Debounced IGDB search
  useEffect(() => {
    if (picked || query.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      api
        .get(`/games/search?query=${encodeURIComponent(query.trim())}`)
        .then((res) => setSearchResults(res.data.slice(0, 6)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query, picked])

  const handleSave = async () => {
    if (!picked) return
    setSaving(true)
    setError("")
    try {
      const res = await api.post("/diary", {
        game_id: picked.id,
        played_at: playedAt,
        status,
        rating: status === "Completed" ? rating : null,
        note: note.trim() || null,
      })
      onCreated(res.data)
      onClose()
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setError(typeof message === "string" ? message : "Could not save entry")
    } finally {
      setSaving(false)
    }
  }

  const getCoverUrl = (url?: string | null) => {
    if (!url) return null
    const big = url.replace("t_thumb", "t_cover_small")
    return big.startsWith("http") ? big : `https:${big}`
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--cp-bg)] border border-[var(--cp-border)] rounded-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-[var(--cp-border)] flex items-center justify-between">
          <span className="text-[13px] uppercase tracking-[.04em] text-[var(--cp-text-dim)] font-semibold">
            New diary entry
          </span>
          <button
            onClick={onClose}
            className="text-[var(--cp-text-dimmer)] hover:text-[var(--cp-text)] text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* GAME PICKER */}
          {picked ? (
            <div className="flex items-center gap-3 p-2 rounded-sm border border-[var(--cp-border)] bg-[var(--cp-surf)]">
              {getCoverUrl(picked.cover?.url) ? (
                <img
                  src={getCoverUrl(picked.cover?.url)!}
                  alt=""
                  className="w-10 h-14 object-cover rounded-sm"
                />
              ) : (
                <div className="w-10 h-14 rounded-sm bg-[var(--cp-surf-2)]" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[var(--cp-text)] text-sm font-medium truncate">
                  {picked.name}
                </p>
                {picked.first_release_date && (
                  <p className="text-[12px] text-[var(--cp-text-dim)]">
                    {new Date(picked.first_release_date * 1000).getFullYear()}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setPicked(null)
                  setQuery("")
                }}
                className="text-[12px] text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] px-2"
              >
                Change
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a game…"
                className="w-full p-2.5 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)] text-sm"
              />
              {searching && (
                <p className="mt-2 text-[12px] text-[var(--cp-text-dimmer)]">
                  Searching…
                </p>
              )}
              {!searching && searchResults.length > 0 && (
                <ul className="mt-2 max-h-56 overflow-y-auto border border-[var(--cp-border)] rounded-sm divide-y divide-[var(--cp-border)]">
                  {searchResults.map((g) => (
                    <li key={g.id}>
                      <button
                        onClick={() => setPicked(g)}
                        className="w-full flex items-center gap-3 p-2 text-left hover:bg-[var(--cp-surf)] transition"
                      >
                        {getCoverUrl(g.cover?.url) ? (
                          <img
                            src={getCoverUrl(g.cover?.url)!}
                            alt=""
                            className="w-8 h-11 object-cover rounded-sm shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-11 rounded-sm bg-[var(--cp-surf-2)] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--cp-text)] truncate">
                            {g.name}
                          </p>
                          {g.first_release_date && (
                            <p className="text-[11px] text-[var(--cp-text-dim)]">
                              {new Date(g.first_release_date * 1000).getFullYear()}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* STATUS + DATE + RATING + NOTE — only enabled once a game is picked */}
          <div
            className={`space-y-4 transition ${picked ? "" : "opacity-40 pointer-events-none"}`}
          >
            <div>
              <p className="text-[12px] uppercase tracking-[.04em] text-[var(--cp-text-dim)] font-semibold mb-2">
                Status
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="px-2.5 py-2 rounded-sm text-xs text-left transition border"
                    style={{
                      borderColor:
                        status === s ? "var(--cp-accent)" : "var(--cp-border)",
                      color:
                        status === s ? "var(--cp-accent)" : "var(--cp-text-dim)",
                      background:
                        status === s ? "rgba(217,70,239,.10)" : "transparent",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] uppercase tracking-[.04em] text-[var(--cp-text-dim)] font-semibold mb-2">
                Played on
              </p>
              <input
                type="date"
                value={playedAt}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setPlayedAt(e.target.value)}
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  try {
                    (e.currentTarget as HTMLInputElement).showPicker?.()
                  } catch {
                    // showPicker can throw if not triggered by a user gesture
                  }
                }}
                className="w-full p-2 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)] text-sm cursor-pointer"
              />
            </div>

            {status === "Completed" && (
              <div>
                <p className="text-[12px] uppercase tracking-[.04em] text-[var(--cp-text-dim)] font-semibold mb-2">
                  Rating
                </p>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const active = rating !== null && n <= rating
                    return (
                      <button
                        key={n}
                        onClick={() => setRating(rating === n ? null : n)}
                        className="aspect-square rounded-sm text-[11px] font-mono tabular-nums font-semibold transition flex items-center justify-center"
                        style={{
                          background: active ? "var(--cp-star)" : "transparent",
                          color: active
                            ? "var(--cp-bg)"
                            : "var(--cp-text-dimmer)",
                          border: active
                            ? "1px solid var(--cp-star)"
                            : "1px solid var(--cp-border)",
                        }}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[12px] uppercase tracking-[.04em] text-[var(--cp-text-dim)] font-semibold">
                  Note
                </span>
                <span className="text-[11px] text-[var(--cp-text-dimmer)]">
                  optional
                </span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full p-2 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)] text-sm resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-red-400">{error}</p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[var(--cp-border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!picked || saving}
            className="px-4 py-1.5 rounded-sm bg-[var(--cp-accent)] text-white text-[12px] font-semibold hover:brightness-110 transition disabled:opacity-40"
          >
            {saving ? "Saving…" : "Add entry"}
          </button>
        </div>
      </div>
    </div>
  )
}
