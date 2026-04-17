import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import type { GameList } from "../types"
import Toast from "../components/Toast"
import useTitle from "../hooks/useTitle"

export default function Lists() {
  useTitle("My Lists")
  const navigate = useNavigate()
  const [lists, setLists] = useState<GameList[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    api.get("/lists")
      .then((res) => setLists(res.data))
      .catch(() => setLists([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const res = await api.post("/lists", {
        name: newName,
        description: newDesc || null,
      })
      setLists([res.data, ...lists])
      setNewName("")
      setNewDesc("")
      setShowCreate(false)
      setSuccess("List created!")
    } catch {
      setError("Failed to create list")
    }
  }

  const handleDelete = async (listId: number) => {
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
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)]">My Lists</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition"
          >
            {showCreate ? "Cancel" : "New List"}
          </button>
        </div>

        {showCreate && (
          <div className="bg-[var(--cp-surf)] rounded-lg p-6 mb-6 border border-[var(--cp-border)]">
            <div className="space-y-3">
              <div>
                <label className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider block mb-1.5">LIST NAME</label>
                <input
                  type="text"
                  placeholder="My awesome list"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
                />
              </div>
              <div>
                <label className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider block mb-1.5">DESCRIPTION</label>
                <textarea
                  placeholder="Optional description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 resize-none border border-[var(--cp-border)]"
                />
              </div>
              <button
                onClick={handleCreate}
                className="px-6 py-2 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {lists.length === 0 && !showCreate && (
          <p className="text-[var(--cp-text-dim)] text-center font-display text-xl italic mt-12">No lists yet. Create one!</p>
        )}

        <div className="space-y-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-[var(--cp-surf)] rounded-lg p-4 border border-[var(--cp-border)] flex items-center justify-between hover:border-[var(--cp-accent)]/20 transition"
            >
              <div
                onClick={() => navigate(`/lists/${list.id}`)}
                className="cursor-pointer flex-1"
              >
                <h3 className="text-[var(--cp-text)] font-semibold hover:text-[var(--cp-accent)] transition">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="text-[var(--cp-text-dimmer)] text-sm mt-1">{list.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(list.id)}
                className="text-[var(--cp-text-dimmer)] hover:text-[var(--cp-accent)] text-sm ml-4 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
