import { useState, useEffect } from "react"
import api from "../api"
import type { GameList } from "../types"

interface AddToListProps {
  gameId: number
}

export default function AddToList({ gameId }: AddToListProps) {
  const [lists, setLists] = useState<GameList[]>([])
  const [selectedList, setSelectedList] = useState("")
  const [note, setNote] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    api.get("/lists")
      .then((res) => setLists(res.data))
      .catch(() => setLists([]))
  }, [])

  const handleAdd = async () => {
    if (!selectedList) return
    setSuccess("")
    setError("")
    try {
      await api.post(`/lists/${selectedList}/items`, {
        game_id: gameId,
        note: note || null,
      })
      setSuccess("Added to list!")
      setNote("")
    } catch {
      setError("Already in list or error occurred")
    }
  }

  if (lists.length === 0) {
    return <p className="text-[#8a6baa] text-sm">No lists yet. Create one from the Lists page.</p>
  }

  return (
    <div className="space-y-3">
      {success && <p className="text-green-400 text-sm">{success}</p>}
      {error && <p className="text-fuchsia-400 text-sm">{error}</p>}
      <select
        value={selectedList}
        onChange={(e) => setSelectedList(e.target.value)}
        className="w-full p-3 rounded bg-[#2d1b4e] text-white outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
      >
        <option value="">Select a list</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
      />
      <button
        onClick={handleAdd}
        className="px-6 py-2 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition"
      >
        Add to List
      </button>
    </div>
  )
}