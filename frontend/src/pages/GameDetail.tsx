import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import api from "../api"
import { useAuth } from "../AuthContext"
import { GAME_STATUSES } from "../types"
import type { Game, LibraryEntry, DiaryEntry } from "../types"
import { getCoverUrl, getYear } from "../utils"
import Toast from "../components/Toast"
import { DetailSkeleton } from "../components/Skeleton"
import PlatformIcon from "../components/PlatformIcon"
import StoreLink from "../components/StoreLink"
import AddToList from "../components/AddToList"
import useTitle from "../hooks/useTitle"

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
}

const RAIL_LABEL =
  "text-[12px] uppercase tracking-[.06em] font-semibold text-[var(--cp-text-dim)]"
const RAIL_HINT = "text-[12px] text-[var(--cp-text-dimmer)]"

function getBackdropUrl(game: Game): string | null {
  const source = game.artworks?.[0] || game.screenshots?.[0]
  if (!source?.url) return null
  return `https:${source.url.replace("t_thumb", "t_1080p")}`
}

function formatSessionDate(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export default function GameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [existingEntry, setExistingEntry] = useState<LibraryEntry | null>(null)
  const [expandSummary, setExpandSummary] = useState(false)
  const [similarGames, setSimilarGames] = useState<Game[]>([])
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState<DiaryEntry[]>([])
  const [listModalOpen, setListModalOpen] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [playedAt, setPlayedAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  )

  useTitle(game?.name || "Loading...")

  useEffect(() => {
    api
      .get(`/games/${id}`)
      .then((res) => setGame(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    if (!user) return
    api
      .get("/library")
      .then((res) => {
        const found = res.data.find(
          (e: LibraryEntry) => e.game_id === Number(id),
        )
        if (found) {
          setExistingEntry(found)
          setStatus(found.status)
          setRating(found.rating)
          setReview(found.review || "")
        }
      })
      .catch(() => {})
  }, [user, id])

  useEffect(() => {
    if (!user || !id) return
    api
      .get(`/diary?game_id=${id}`)
      .then((res) => setSessions(res.data))
      .catch(() => {})
  }, [user, id])

  useEffect(() => {
    if (!id) return
    api
      .get(`/games/${id}/similar`)
      .then((res) => setSimilarGames(res.data))
      .catch(() => {})
  }, [id])

  // Rating + review only persist when the entry is Completed. If the user
  // toggles to a non-Completed status, drop the in-memory values so the UI
  // matches what would be saved.
  useEffect(() => {
    if (status && status !== "Completed") {
      setRating(null)
      setReview("")
    }
  }, [status])

  // Reset the "Saved ✓" affordance whenever the user edits anything.
  useEffect(() => {
    setJustSaved(false)
  }, [status, rating, review])

  const willCreateDiaryEntry =
    (status === "Playing" || status === "Completed") &&
    (!existingEntry || existingEntry.status !== status)

  const handleSave = async () => {
    if (!status) {
      setError("Pick a status first")
      return
    }
    setSaving(true)
    const payloadRating = status === "Completed" ? rating : null
    const payloadReview = status === "Completed" ? review || null : null
    // Only send played_at when the save will trigger a diary entry — otherwise
    // the backend would ignore it anyway, but sending it would be misleading.
    const payloadPlayedAt = willCreateDiaryEntry ? playedAt : undefined
    try {
      if (existingEntry) {
        await api.put(`/library/${id}`, {
          status,
          rating: payloadRating,
          review: payloadReview,
          played_at: payloadPlayedAt,
        })
        setExistingEntry({
          ...existingEntry,
          status,
          rating: payloadRating,
          review: payloadReview,
        })
      } else {
        const res = await api.post("/library", {
          game_id: Number(id),
          status,
          rating: payloadRating,
          review: payloadReview,
          played_at: payloadPlayedAt,
        })
        setExistingEntry(res.data)
      }
      setJustSaved(true)
      api
        .get(`/diary?game_id=${id}`)
        .then((res) => setSessions(res.data))
        .catch(() => {})
      setSuccess(existingEntry ? "Updated" : "Added to library")
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--cp-bg)] p-8">
        <div className="max-w-6xl mx-auto">
          <DetailSkeleton />
        </div>
      </div>
    )
  if (!game) return null

  const backdrop = getBackdropUrl(game)
  const storeLinks =
    game.websites?.filter((w) => [1, 13, 16, 17].includes(w.category)) || []
  const summaryLong = (game.summary?.length || 0) > 300
  const developer = game.involved_companies?.find((c) => c.company)?.company
    .name
  const statusColor = status ? STATUS_COLORS[status] : null
  const ratingUnlocked = status === "Completed"
  const recentSessions = sessions.slice(0, 3)

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]">
      {success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setSuccess("")}
        />
      )}
      {error && (
        <Toast message={error} type="error" onClose={() => setError("")} />
      )}

      {/* BACKDROP */}
      <div className="relative h-[240px] md:h-[360px] overflow-hidden">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover scale-105 blur-[2px]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--cp-surf)] to-[var(--cp-bg)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--cp-bg)] via-[var(--cp-bg)]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--cp-bg)]/60 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-48 md:-mt-56 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-white/50 hover:text-white text-[12px] uppercase tracking-[.04em] font-semibold mb-6 inline-flex items-center gap-2 transition"
        >
          ← Back
        </button>

        {/* 2-col layout: content + sticky rail */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
          {/* LEFT: content */}
          <div className="min-w-0">
            <div className="flex flex-col md:flex-row gap-5 md:gap-7 md:items-end">
              {getCoverUrl(game) ? (
                <img
                  src={getCoverUrl(game)!}
                  alt={game.name}
                  className="w-40 md:w-48 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-40 md:w-48 aspect-[3/4] bg-[var(--cp-surf)] rounded-lg flex items-center justify-center text-[var(--cp-text-dimmer)] ring-1 ring-white/10 cover-placeholder text-lg italic shrink-0">
                  {game.name}
                </div>
              )}

              <div className="flex-1 min-w-0 md:pb-2">
                <div className="text-[13px] text-[var(--cp-text-dim)] mb-2">
                  <span className="font-mono tabular-nums">
                    {getYear(game.first_release_date) || "—"}
                  </span>
                  {developer && <> · {developer}</>}
                </div>
                <h1 className="font-display text-3xl md:text-[2.75rem] text-[var(--cp-text)] leading-[1.05] tracking-tight">
                  {game.name}
                </h1>

                {game.genres && (
                  <div className="flex gap-1.5 mt-4 flex-wrap">
                    {game.genres.slice(0, 5).map((g) => (
                      <span
                        key={g.name}
                        className="px-2.5 py-1 rounded-sm text-[11.5px] font-medium text-[var(--cp-accent)]/90 bg-[var(--cp-accent)]/10 border border-[var(--cp-accent)]/25"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  {game.aggregated_rating && (
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-md flex items-center justify-center font-mono tabular-nums font-bold text-sm ring-1 ${
                          game.aggregated_rating >= 75
                            ? "bg-green-500/15 text-green-400 ring-green-500/30"
                            : game.aggregated_rating >= 50
                              ? "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30"
                              : "bg-red-500/15 text-red-400 ring-red-500/30"
                        }`}
                      >
                        {game.aggregated_rating.toFixed(0)}
                      </div>
                      <span className="text-[var(--cp-text-dim)] text-[12px] uppercase tracking-[.04em] font-semibold">
                        Critic
                      </span>
                    </div>
                  )}

                  {game.platforms && (
                    <div className="flex gap-1.5 flex-wrap">
                      {game.platforms.slice(0, 4).map((p) => (
                        <PlatformIcon
                          key={p.name}
                          name={p.name}
                          abbreviation={p.abbreviation}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary — no "About" label, paragraph carries itself */}
            {game.summary && (
              <div className="mt-8">
                <p
                  className={`text-[var(--cp-text-dim)] text-sm leading-relaxed ${
                    !expandSummary && summaryLong ? "line-clamp-5" : ""
                  }`}
                >
                  {game.summary}
                </p>
                {summaryLong && (
                  <button
                    onClick={() => setExpandSummary(!expandSummary)}
                    className="text-[var(--cp-accent)] text-xs mt-2 hover:brightness-110 transition font-medium"
                  >
                    {expandSummary ? "Show less" : "Read more →"}
                  </button>
                )}
              </div>
            )}

            {storeLinks.length > 0 && (
              <div className="mt-6 flex gap-2 flex-wrap">
                {storeLinks.map((w, i) => (
                  <StoreLink key={i} url={w.url} category={w.category} />
                ))}
              </div>
            )}

            {similarGames.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] font-medium text-[var(--cp-text-dim)]">
                    More like this
                  </div>
                  <Link
                    to={`/search?similar=${id}`}
                    className="text-[12px] text-[var(--cp-text-dim)] hover:text-[var(--cp-accent)] transition"
                  >
                    See all →
                  </Link>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {similarGames.slice(0, 5).map((g) => (
                    <div
                      key={g.id}
                      onClick={() => navigate(`/game/${g.id}`)}
                      className="cursor-pointer group"
                    >
                      {getCoverUrl(g) ? (
                        <img
                          src={getCoverUrl(g)!}
                          alt={g.name}
                          className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-[var(--cp-surf)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-xs cover-placeholder italic p-2 text-center">
                          {g.name}
                        </div>
                      )}
                      <p className="text-[11px] text-[var(--cp-text-dim)] mt-1.5 truncate">
                        {g.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-20" />
          </div>

          {/* RIGHT: sticky library rail */}
          <aside className="lg:sticky lg:top-4 space-y-3">
            {!user ? (
              <div className="border border-[var(--cp-border)] rounded-lg bg-[var(--cp-surf)]/60 p-6 text-center backdrop-blur-sm">
                <div className="font-display text-xl text-[var(--cp-text)] mb-4">
                  Sign in to track
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full px-4 py-2.5 rounded-sm bg-[var(--cp-accent)] text-white font-semibold text-sm hover:brightness-110 transition"
                >
                  Sign in
                </button>
              </div>
            ) : (
              <div className="border border-[var(--cp-border)] rounded-lg bg-[var(--cp-surf)]/70 backdrop-blur-sm overflow-hidden">
                {/* Header — status ribbon when chosen, mono TRACK label otherwise */}
                <div className="px-4 py-3 border-b border-[var(--cp-border)] flex items-center justify-between min-h-[44px]">
                  {status && statusColor ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: statusColor }}
                      />
                      <span
                        className="text-[12px] uppercase tracking-[.06em] font-semibold"
                        style={{ color: statusColor }}
                      >
                        {status}
                      </span>
                    </div>
                  ) : (
                    <span className={RAIL_LABEL}>Track</span>
                  )}
                </div>

                <div className="p-4 space-y-5">
                  {/* STATUS — segmented (no label, the chips speak for themselves) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {GAME_STATUSES.map((s) => {
                      const active = status === s
                      const color = STATUS_COLORS[s]
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          className="px-2.5 py-2 rounded-sm text-xs text-left transition flex items-center gap-2 border"
                          style={{
                            borderColor: active ? color : "var(--cp-border)",
                            background: active ? `${color}1a` : "transparent",
                            color: active ? color : "var(--cp-text-dim)",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <span className="truncate">{s}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* SCORE — gated on Completed */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={RAIL_LABEL}>Score</span>
                      {ratingUnlocked && rating ? (
                        <span className="font-mono tabular-nums text-[12px] text-[var(--cp-star)]">
                          {rating} / 10
                        </span>
                      ) : null}
                    </div>
                    {ratingUnlocked ? (
                      <div className="grid grid-cols-10 gap-1">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(
                          (n) => {
                            const active = rating !== null && n <= rating
                            return (
                              <button
                                key={n}
                                onClick={() =>
                                  setRating(rating === n ? null : n)
                                }
                                className="aspect-square rounded-sm text-[12px] font-mono tabular-nums font-semibold transition flex items-center justify-center"
                                style={{
                                  background: active
                                    ? "var(--cp-star)"
                                    : "transparent",
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
                          },
                        )}
                      </div>
                    ) : (
                      <div
                        aria-hidden
                        className="grid grid-cols-10 gap-1 opacity-40 pointer-events-none select-none"
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(
                          (n) => (
                            <div
                              key={n}
                              className="aspect-square rounded-sm text-[12px] font-mono tabular-nums font-semibold flex items-center justify-center border border-[var(--cp-border)] text-[var(--cp-text-dimmer)]"
                            >
                              {n}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* REVIEW — gated on Completed */}
                  {ratingUnlocked && (
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className={RAIL_LABEL}>Review</span>
                        <span className={RAIL_HINT}>optional</span>
                      </div>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full p-2.5 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 resize-none border border-[var(--cp-border)] text-sm leading-relaxed"
                      />
                    </div>
                  )}

                  {/* PLAYED ON — only relevant when this save will create a diary entry */}
                  {willCreateDiaryEntry && (
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className={RAIL_LABEL}>Played on</span>
                        <span className={RAIL_HINT}>defaults to today</span>
                      </div>
                      <input
                        type="date"
                        value={playedAt}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setPlayedAt(e.target.value)}
                        className="w-full p-2 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)] text-sm"
                      />
                    </div>
                  )}

                  {/* PRIMARY CTA */}
                  <button
                    onClick={handleSave}
                    disabled={!status || saving}
                    className="w-full py-2.5 rounded-sm bg-[var(--cp-accent)] text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving…" : justSaved ? "Saved ✓" : "Save"}
                  </button>

                  {/* Secondary outline chips: Add to list · Share */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setListModalOpen((v) => !v)}
                      className="py-2 rounded-sm border border-[var(--cp-border)] text-[12.5px] text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] hover:border-[var(--cp-text-dimmer)] transition"
                    >
                      + Add to list
                    </button>
                    <button
                      onClick={() => {
                        const url = window.location.href
                        if (navigator.share) {
                          navigator
                            .share({ title: game.name, url })
                            .catch(() => {})
                        } else {
                          navigator.clipboard?.writeText(url)
                          setSuccess("Link copied")
                        }
                      }}
                      className="py-2 rounded-sm border border-[var(--cp-border)] text-[12.5px] text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] hover:border-[var(--cp-text-dimmer)] transition"
                    >
                      Share
                    </button>
                  </div>

                  {listModalOpen && (
                    <div className="pt-2">
                      <AddToList gameId={Number(id)} />
                    </div>
                  )}
                </div>

                {/* SESSIONS — read-only history of status transitions; entries are auto-created on save */}
                {status && (
                  <div className="border-t border-[var(--cp-border)] p-4 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className={RAIL_LABEL}>Sessions</span>
                      {sessions.length > 0 && (
                        <span className="font-mono tabular-nums text-[12px] text-[var(--cp-text-dimmer)]">
                          {sessions.length}
                        </span>
                      )}
                    </div>

                    {sessions.length > 0 ? (
                      <ul className="space-y-1.5">
                        {recentSessions.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-baseline gap-2 text-[12.5px] leading-snug"
                          >
                            <span className="font-mono tabular-nums text-[12px] text-[var(--cp-text-dimmer)] shrink-0 w-14">
                              {formatSessionDate(s.played_at)}
                            </span>
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                background:
                                  STATUS_COLORS[s.status] ||
                                  "var(--cp-text-dimmer)",
                              }}
                              aria-hidden
                            />
                            <span className="text-[var(--cp-text-dim)] truncate">
                              {s.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12px] text-[var(--cp-text-dimmer)] leading-relaxed">
                        Sessions appear automatically when you mark this game as
                        Playing or Completed.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
