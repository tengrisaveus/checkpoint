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

  if (loading) return <div className="min-h-screen bg-[#0d0015] text-[#a78bba] p-8">Loading...</div>
  if (!list) return null

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/lists")}
          className="text-[#a78bba] hover:text-white mb-6 inline-block"
        >
          ← Back to Lists
        </button>

        {editing ? (
          <div className="bg-[#1a0a2e] rounded-lg p-6 mb-6 border border-[#2d1b4e]">
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 rounded bg-[#2d1b4e] text-white outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none border border-[#3d2b5e]"
              />
              <div className="flex gap-2">
                <button onClick={handleUpdate} className="px-4 py-2 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition">Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded bg-[#2d1b4e] text-[#a78bba] hover:text-white transition border border-[#3d2b5e]">Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white">{list.name}</h1>
              <button
                onClick={() => setEditing(true)}
                className="text-[#8a6baa] hover:text-fuchsia-400 text-sm transition"
              >
                Edit
              </button>
            </div>
            {list.description && (
              <p className="text-[#a78bba] mt-2">{list.description}</p>
            )}
            <p className="text-[#8a6baa] text-sm mt-1">{list.items?.length || 0} games</p>
          </div>
        )}

        {(!list.items || list.items.length === 0) && (
          <p className="text-[#a78bba] text-center">
            No games in this list yet.
            <span onClick={() => navigate("/search")} className="text-fuchsia-400 hover:underline cursor-pointer ml-1">
              Search for games
            </span>
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-lg flex items-center justify-center text-[#8a6baa] text-xs text-center p-2">
                    {item.game_name}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemoveItem(item.game_id)}
                className="absolute top-2 right-2 bg-black/60 text-fuchsia-400 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm"
              >
                ✕
              </button>
              <p className="text-white text-sm mt-2 truncate">{item.game_name}</p>
              {item.note && <p className="text-[#8a6baa] text-xs truncate">{item.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}