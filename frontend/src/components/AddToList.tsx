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
    return <p className="text-[var(--cp-text-dimmer)] text-sm italic font-display">No lists yet. Create one from the Lists page.</p>
  }

  return (
    <div className="space-y-3">
      {success && <p className="text-[var(--cp-success)] text-sm font-mono">{success}</p>}
      {error && <p className="text-[var(--cp-accent)] text-sm font-mono">{error}</p>}
      <select
        value={selectedList}
        onChange={(e) => setSelectedList(e.target.value)}
        className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
      >
        <option value="" className="bg-[var(--cp-surf)]">Select a list</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id} className="bg-[var(--cp-surf)]">{l.name}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
      />
      <button
        onClick={handleAdd}
        className="px-6 py-2 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition"
      >
        Add to List
      </button>
    </div>
  )
}
