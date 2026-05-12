import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"
import type { GameList, LibraryEntry } from "../types"
import Toast from "../components/Toast"
import useTitle from "../hooks/useTitle"
import { useAuth } from "../AuthContext"

type ViewMode = "grid" | "ranked" | "notes"

const BANNER_STRIPES = [
  "linear-gradient(165deg,#5a1a3a,#1a0a2e)",
  "linear-gradient(160deg,#2a1a5a,#5a1a3a)",
  "linear-gradient(180deg,#4c1d95,#831843)",
  "linear-gradient(200deg,#1e3a8a,#4c1d95)",
  "linear-gradient(175deg,#6b21a8,#312e81)",
  "linear-gradient(195deg,#831843,#4c1d95)",
]

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getCoverUrl(url: string | null) {
  if (!url) return null
  return url.startsWith("http") ? url : `https:${url}`
}

function splitTitle(name: string): { lead: string; accent: string; tail: string } {
  const words = name.trim().split(/\s+/)
  if (words.length === 0) return { lead: "", accent: "", tail: "" }
  if (words.length === 1) return { lead: "", accent: words[0], tail: "" }
  const accentIdx = Math.floor(words.length / 2)
  return {
    lead: words.slice(0, accentIdx).join(" "),
    accent: words[accentIdx],
    tail: words.slice(accentIdx + 1).join(" "),
  }
}

export default function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState<GameList | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [view, setView] = useState<ViewMode>("grid")
  const [ratings, setRatings] = useState<Record<number, number | null>>({})
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useTitle(list?.name || "List")

  useEffect(() => {
    api.get(`/lists/${id}`)
      .then((res) => {
        setList(res.data)
        setEditName(res.data.name)
        setEditDesc(res.data.description || "")
      })
      .catch(() => navigate("/lists"))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    api.get("/library")
      .then((res) => {
        const map: Record<number, number | null> = {}
        for (const e of res.data as LibraryEntry[]) {
          map[e.game_id] = e.rating
        }
        setRatings(map)
      })
      .catch(() => setRatings({}))
  }, [])

  const titleParts = useMemo(() => splitTitle(list?.name || ""), [list?.name])

  const handleUpdate = async () => {
    if (!editName.trim()) return
    try {
      const res = await api.put(`/lists/${id}`, {
        name: editName,
        description: editDesc || null,
      })
      setList({ ...list!, name: res.data.name, description: res.data.description })
      setEditing(false)
      setSuccess("List updated!")
    } catch {
      setError("Failed to update list")
    }
  }

  const handleRemoveItem = async (gameId: number) => {
    try {
      await api.delete(`/lists/${id}/items/${gameId}`)
      setList({
        ...list!,
        items: list!.items?.filter((item) => item.game_id !== gameId),
      })
      setSuccess("Game removed!")
    } catch {
      setError("Failed to remove game")
    }
  }

  if (loading) return <div className="min-h-screen bg-[var(--cp-bg)] text-[var(--cp-text-dim)] p-8">Loading...</div>
  if (!list) return null

  const items = list.items || []
  const itemCount = items.length

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="relative w-full h-[180px] md:h-[240px] overflow-hidden">
        <div className="absolute inset-0 flex">
          {BANNER_STRIPES.map((bg, i) => (
            <div key={i} className="flex-1 h-full" style={{ background: bg }} />
          ))}
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, var(--cp-bg) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, var(--cp-bg) 0%, transparent 50%, var(--cp-bg) 100%)",
          }}
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10 -mt-[100px] relative">
        <button
          onClick={() => navigate("/lists")}
          className="text-[12px] uppercase tracking-[.04em] font-semibold text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition mb-6 inline-block"
        >
          ← BACK TO LISTS
        </button>

        {editing ? (
          <div className="bg-[var(--cp-surf)] rounded-lg p-6 mb-8 border border-[var(--cp-border)]">
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 rounded-sm bg-transparent font-display text-3xl text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="w-full p-3 rounded-sm bg-transparent italic font-display text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 resize-none border border-[var(--cp-border)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-sm bg-[var(--cp-accent)] text-white uppercase text-[12px] tracking-[.04em] font-semibold hover:brightness-110 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-sm text-[var(--cp-text-dim)] uppercase text-[12px] tracking-[.04em] font-semibold border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[var(--cp-accent)] mb-3">
                A list by @{(user?.username || "you").toLowerCase()}
              </div>
              <h1
                className="font-display text-[40px] md:text-[64px] leading-[1.02] text-[var(--cp-text)]"
              >
                {titleParts.lead && <span>{titleParts.lead} </span>}
                <em className="italic text-[var(--cp-accent)]">{titleParts.accent}</em>
                {titleParts.tail && <span> {titleParts.tail}</span>}
              </h1>
              {list.description && (
                <p className="font-display italic text-[var(--cp-text-dim)] text-[18px] mt-4 max-w-2xl">
                  {list.description}
                </p>
              )}
              <p className="text-[12px] text-[var(--cp-text-dim)] mt-5">
                {itemCount} {itemCount === 1 ? "game" : "games"} · updated {timeAgo(list.updated_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setEditing(true)}
                className="uppercase tracking-[.04em] text-[12px] font-semibold px-4 py-2 rounded-sm border border-[var(--cp-border)] text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)] transition"
              >
                Edit
              </button>
              <button
                disabled
                title="Coming soon"
                className="uppercase tracking-[.04em] text-[12px] font-semibold px-4 py-2 rounded-sm border border-[var(--cp-border)] text-[var(--cp-text-dimmer)] cursor-not-allowed"
              >
                Reorder
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                  setSuccess("Link copied!")
                }}
                className="uppercase tracking-[.04em] text-[12px] font-semibold px-4 py-2 rounded-sm border border-[var(--cp-border)] text-[var(--cp-text-dim)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)] transition"
              >
                Share
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-b border-[var(--cp-border)] mb-6 overflow-x-auto">
          <div className="flex items-center gap-2 pb-3">
            {(["grid", "ranked", "notes"] as ViewMode[]).map((m) => {
              const active = view === m
              return (
                <button
                  key={m}
                  onClick={() => setView(m)}
                  className={`uppercase tracking-[.04em] text-[12px] font-semibold px-3 py-1.5 rounded-sm transition whitespace-nowrap ${
                    active
                      ? "bg-[var(--cp-accent)]/15 text-[var(--cp-accent)]"
                      : "text-[var(--cp-text-dim)] hover:text-[var(--cp-text)]"
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => navigate("/search")}
            className="uppercase tracking-[.04em] text-[12px] font-semibold text-[var(--cp-accent)] hover:brightness-110 transition pb-3 whitespace-nowrap"
          >
            + Add games
          </button>
        </div>

        {itemCount === 0 && (
          <div className="border border-dashed border-[var(--cp-border)] rounded-lg p-16 text-center mb-12">
            <p className="font-display italic text-2xl text-[var(--cp-text-dim)] mb-3">
              No games in this list yet.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="uppercase tracking-[.04em] text-[12px] font-semibold text-[var(--cp-accent)] hover:brightness-110 transition"
            >
              Search for games →
            </button>
          </div>
        )}

        {view === "grid" && itemCount > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5 pb-16">
            {items.map((item) => {
              const url = getCoverUrl(item.game_cover_url)
              return (
                <div key={item.id} className="relative group">
                  <div
                    onClick={() => navigate(`/game/${item.game_id}`)}
                    className="cursor-pointer"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={item.game_name}
                        className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[var(--cp-surf-2)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-xs text-center p-2 cover-placeholder italic">
                        {item.game_name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.game_id)}
                    className="absolute top-2 right-2 bg-black/60 text-[var(--cp-accent)] rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm"
                  >
                    ✕
                  </button>
                  <p className="text-[var(--cp-text)] text-[12px] mt-2 truncate">{item.game_name}</p>
                </div>
              )
            })}
          </div>
        )}

        {(view === "ranked" || view === "notes") && itemCount > 0 && (
          <div className="pb-16">
            {items.map((item, i) => {
              const url = getCoverUrl(item.game_cover_url)
              const rating = ratings[item.game_id]
              const isTop = i < 3
              return (
                <div
                  key={item.id}
                  className="group grid grid-cols-[52px_70px_1fr_auto] gap-4 items-center py-4 border-b border-[var(--cp-border)]"
                >
                  <div
                    className={`font-display italic text-[36px] leading-none ${
                      isTop ? "text-[var(--cp-accent)]" : "text-[var(--cp-text-dimmer)]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div
                    onClick={() => navigate(`/game/${item.game_id}`)}
                    className="cursor-pointer"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={item.game_name}
                        className="w-[64px] aspect-[3/4] object-cover rounded cover-hover"
                      />
                    ) : (
                      <div className="w-[64px] aspect-[3/4] bg-[var(--cp-surf-2)] rounded flex items-center justify-center text-[var(--cp-text-dimmer)] text-[10px] text-center p-1 cover-placeholder italic">
                        {item.game_name}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      onClick={() => navigate(`/game/${item.game_id}`)}
                      className="font-display text-xl text-[var(--cp-text)] cursor-pointer hover:text-[var(--cp-accent)] transition truncate"
                    >
                      {item.game_name}
                    </div>
                    {item.note && (
                      <p
                        className={`font-display italic text-[var(--cp-text-dim)] text-[15px] mt-1 ${
                          view === "ranked" ? "line-clamp-2" : ""
                        }`}
                      >
                        {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="uppercase tracking-[.04em] text-[12px] font-semibold text-[var(--cp-text-dim)] w-12 text-right">
                      {rating != null ? `${rating}/10` : ""}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.game_id)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-[var(--cp-accent)] text-xs opacity-0 group-hover:opacity-100 hover:bg-black/60 transition"
                      aria-label="Remove from list"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
