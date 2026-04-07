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

  if (loading) return <div className="min-h-screen bg-[#0d0015] text-[#a78bba] p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">My Lists</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition"
          >
            {showCreate ? "Cancel" : "New List"}
          </button>
        </div>

        {showCreate && (
          <div className="bg-[#1a0a2e] rounded-lg p-6 mb-6 border border-[#2d1b4e]">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="List name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
              />
              <textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none border border-[#3d2b5e]"
              />
              <button
                onClick={handleCreate}
                className="px-6 py-2 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {lists.length === 0 && !showCreate && (
          <p className="text-[#a78bba] text-center">No lists yet. Create one!</p>
        )}

        <div className="space-y-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-[#1a0a2e] rounded-lg p-4 border border-[#2d1b4e] flex items-center justify-between"
            >
              <div
                onClick={() => navigate(`/lists/${list.id}`)}
                className="cursor-pointer flex-1"
              >
                <h3 className="text-white font-semibold hover:text-fuchsia-400 transition">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="text-[#8a6baa] text-sm mt-1">{list.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(list.id)}
                className="text-fuchsia-400 hover:text-fuchsia-300 text-sm ml-4"
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