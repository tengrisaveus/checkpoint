import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { GameList, GameListItem } from "../types"
import Toast from "../components/Toast"
import useTitle from "../hooks/useTitle"

type SortMode = "recent" | "name" | "size"

interface ListWithItems extends GameList {
  items: GameListItem[]
}

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

function CoverStack({ items }: { items: GameListItem[] }) {
  const slice = items.slice(0, 5)
  const count = slice.length

  if (count === 0) {
    return (
      <div className="relative w-[180px] h-[124px] flex items-center justify-center">
        <div className="w-[78px] aspect-[3/4] rounded border border-dashed border-[var(--cp-border)] flex items-center justify-center">
          <span className="font-display italic text-[var(--cp-text-dimmer)] text-xs">empty</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-[180px] h-[124px]">
      {slice.map((item, i) => {
        const url = getCoverUrl(item.game_cover_url)
        const left = i * 22
        const top = i
        const rotate = (i - count / 2) * 1.5
        return (
          <div
            key={item.id}
            className="absolute w-[78px] aspect-[3/4] rounded overflow-hidden bg-[var(--cp-surf-2)]"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              transform: `rotate(${rotate}deg)`,
              zIndex: i,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            {url ? (
              <img src={url} alt={item.game_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] italic text-[var(--cp-text-dimmer)] p-1 text-center font-display">
                {item.game_name}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Lists() {
  useTitle("My Lists")
  const navigate = useNavigate()
  const [lists, setLists] = useState<ListWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [sortMode, setSortMode] = useState<SortMode>("recent")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    api.get("/lists")
      .then(async (res) => {
        const metas: GameList[] = res.data
        const detailed = await Promise.all(
          metas.map((m) =>
            api.get(`/lists/${m.id}`)
              .then((r) => ({ ...m, ...r.data, items: r.data.items || [] }) as ListWithItems)
              .catch(() => ({ ...m, items: [] }) as ListWithItems)
          )
        )
        if (!cancelled) setLists(detailed)
      })
      .catch(() => { if (!cancelled) setLists([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const sorted = useMemo(() => {
    const copy = [...lists]
    if (sortMode === "recent") {
      copy.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    } else if (sortMode === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortMode === "size") {
      copy.sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0))
    }
    return copy
  }, [lists, sortMode])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const res = await api.post("/lists", {
        name: newName,
        description: newDesc || null,
      })
      setLists([{ ...res.data, items: [] }, ...lists])
      setNewName("")
      setNewDesc("")
      setShowCreate(false)
      setSuccess("List created!")
    } catch {
      setError("Failed to create list")
    }
  }

  const handleDelete = async (e: React.MouseEvent, listId: number) => {
    e.stopPropagation()
    if (!confirm("Delete this list? This can't be undone.")) return
    try {
      await api.delete(`/lists/${listId}`)
      setLists(lists.filter((l) => l.id !== listId))
      setSuccess("List deleted!")
    } catch {
      setError("Failed to delete list")
    }
  }

  if (loading) return <div className="min-h-screen bg-[var(--cp-bg)] text-[var(--cp-text-dim)] p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-10">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="font-mono uppercase tracking-wider text-[10px] text-[var(--cp-text-dimmer)] mb-3">
              YOUR LISTS · {lists.length}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="font-mono text-[11px] uppercase tracking-wider bg-transparent text-[var(--cp-text-dim)] border border-[var(--cp-border)] rounded-sm px-3 py-2 outline-none hover:border-[var(--cp-accent)]/40 transition"
            >
              <option value="recent">Recent</option>
              <option value="name">A–Z</option>
              <option value="size">Most games</option>
            </select>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 rounded-sm border border-[var(--cp-accent)]/50 text-[var(--cp-accent)] hover:bg-[var(--cp-accent)]/10 transition"
            >
              {showCreate ? "Cancel" : "+ New list"}
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-[var(--cp-surf)] rounded-lg p-6 mb-8 border border-[var(--cp-border)]">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="A new list…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 rounded-sm bg-transparent text-xl font-display text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
              />
              <textarea
                placeholder="What's it about?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-sm bg-transparent italic font-display text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 resize-none border border-[var(--cp-border)]"
              />
              <button
                onClick={handleCreate}
                className="px-6 py-2 rounded-sm bg-[var(--cp-accent)] text-white font-mono uppercase text-[11px] tracking-wider hover:brightness-110 transition"
              >
                Create list
              </button>
            </div>
          </div>
        )}

        {sorted.length === 0 && !showCreate && (
          <div className="border border-dashed border-[var(--cp-border)] rounded-lg p-16 text-center">
            <p className="font-display italic text-2xl text-[var(--cp-text-dim)] mb-4">No lists yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="font-mono text-[11px] uppercase tracking-wider text-[var(--cp-accent)] hover:brightness-110 transition"
            >
              + Create your first list
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((list) => (
            <div
              key={list.id}
              onClick={() => navigate(`/lists/${list.id}`)}
              className="group relative bg-[var(--cp-surf)] rounded-lg p-5 border border-[var(--cp-border)] flex items-center gap-5 cursor-pointer hover:border-[var(--cp-accent)]/40 transition"
            >
              <div className="flex-shrink-0">
                <CoverStack items={list.items} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-xl text-[var(--cp-text)] truncate">{list.name}</h3>
                {list.description && (
                  <p className="font-display italic text-[var(--cp-text-dim)] text-[15px] mt-1 line-clamp-2">
                    {list.description}
                  </p>
                )}
                <p className="font-mono uppercase tracking-wider text-[10px] text-[var(--cp-text-dimmer)] mt-3">
                  {list.items.length} {list.items.length === 1 ? "game" : "games"} · updated {timeAgo(list.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, list.id)}
                aria-label="Delete list"
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-[var(--cp-accent)] text-xs opacity-0 group-hover:opacity-100 hover:bg-black/60 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
