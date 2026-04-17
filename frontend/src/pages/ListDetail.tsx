import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"
import type { GameList } from "../types"
import Toast from "../components/Toast"
import useTitle from "../hooks/useTitle"

export default function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [list, setList] = useState<GameList | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
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

  const getCoverUrl = (url: string | null) => {
    if (!url) return null
    return url.startsWith("http") ? url : `https:${url}`
  }

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

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-[1440px] mx-auto">
        <button
          onClick={() => navigate("/lists")}
          className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] mb-6 inline-block transition text-sm"
        >
          ← Back to Lists
        </button>

        {editing ? (
          <div className="bg-[var(--cp-surf)] rounded-lg p-6 mb-6 border border-[var(--cp-border)]">
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 resize-none border border-[var(--cp-border)]"
              />
              <div className="flex gap-2">
                <button onClick={handleUpdate} className="px-4 py-2 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition">Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-sm text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50 transition">Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)]">{list.name}</h1>
              <button
                onClick={() => setEditing(true)}
                className="text-[var(--cp-text-dimmer)] hover:text-[var(--cp-accent)] text-sm transition"
              >
                Edit
              </button>
            </div>
            {list.description && (
              <p className="text-[var(--cp-text-dim)] mt-2">{list.description}</p>
            )}
            <p className="font-mono text-[var(--cp-text-dimmer)] text-[11px] mt-1">{list.items?.length || 0} games</p>
          </div>
        )}

        {(!list.items || list.items.length === 0) && (
          <p className="text-[var(--cp-text-dim)] text-center font-display text-xl italic mt-12">
            No games in this list yet.
            <span onClick={() => navigate("/search")} className="text-[var(--cp-accent)] cursor-pointer hover:brightness-110 transition not-italic text-base ml-2">
              Search for games →
            </span>
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {list.items?.map((item) => (
            <div key={item.id} className="relative group">
              <div
                onClick={() => navigate(`/game/${item.game_id}`)}
                className="cursor-pointer"
              >
                {getCoverUrl(item.game_cover_url) ? (
                  <img
                    src={getCoverUrl(item.game_cover_url)!}
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
              <p className="text-[var(--cp-text)] text-sm mt-2 truncate">{item.game_name}</p>
              {item.note && <p className="text-[var(--cp-text-dimmer)] text-xs truncate">{item.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
