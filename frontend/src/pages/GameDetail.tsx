import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"
import { useAuth } from "../AuthContext"
import { GAME_STATUSES } from "../types"
import type { Game, LibraryEntry } from "../types"
import { getCoverUrl, getYear } from "../utils"
import RatingSelector from "../components/RatingSelector"
import Toast from "../components/Toast"
import { DetailSkeleton } from "../components/Skeleton"
import useTitle from "../hooks/useTitle"

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
  const [diaryDate, setDiaryDate] = useState(new Date().toISOString().split("T")[0])
  const [diaryNote, setDiaryNote] = useState("")

  useTitle(game?.name || "Loading...")

  useEffect(() => {
    api.get(`/games/${id}`)
      .then((res) => setGame(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    if (!user) return
    api.get("/library")
      .then((res) => {
        const found = res.data.find((e: LibraryEntry) => e.game_id === Number(id))
        if (found) {
          setExistingEntry(found)
          setStatus(found.status)
          setRating(found.rating)
          setReview(found.review || "")
        }
      })
      .catch(() => {})
  }, [user, id])

  const handleAddToLibrary = async () => {
    if (!status) return
    setSuccess("")
    setError("")
    try {
      if (existingEntry) {
        await api.put(`/library/${id}`, {
          status,
          rating: rating,
          review: review || null,
        })
        setExistingEntry({ ...existingEntry, status, rating, review })
      } else {
        await api.post("/library", {
          game_id: Number(id),
          status,
          rating: rating,
          review: review || null,
        })
      }

      if (diaryDate) {
        await api.post("/diary", {
          game_id: Number(id),
          played_at: diaryDate,
          status,
          rating: rating,
          note: diaryNote || null,
        })
      }

      setSuccess(existingEntry ? "Updated & logged!" : "Added to library & diary!")
      setDiaryNote("")
    } catch {
      setError("Something went wrong")
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <DetailSkeleton />
      </div>
    </div>
  )
  if (!game) return null

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white mb-6 inline-block"
        >
          ← Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {getCoverUrl(game) ? (
            <img src={getCoverUrl(game)!} alt={game.name} className="w-64 h-80 object-cover rounded-lg" />
          ) : (
            <div className="w-64 h-80 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">No Cover</div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{game.name}</h1>
            <p className="text-slate-400 mt-2">
              {getYear(game.first_release_date)}
              {game.genres && ` · ${game.genres.map((g) => g.name).join(", ")}`}
            </p>
            {game.platforms && <p className="text-slate-500 text-sm mt-1">{game.platforms.map((p) => p.name).join(", ")}</p>}
            {game.involved_companies && <p className="text-slate-500 text-sm mt-1">{game.involved_companies.map((c) => c.company.name).join(", ")}</p>}
            {game.aggregated_rating && (
              <span className="inline-block mt-3 bg-green-400/20 text-green-400 px-3 py-1 rounded text-sm font-medium">
                Critic: {game.aggregated_rating.toFixed(0)}/100
              </span>
            )}
            {game.summary && <p className="text-slate-300 mt-4">{game.summary}</p>}
          </div>
        </div>

        {user && (
          <div className="bg-slate-900 rounded-lg p-6 mt-8 border border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-4">
              {existingEntry ? "In Your Library" : "Add to Library"}
            </h2>

            <div className="space-y-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 rounded bg-slate-800 text-white outline-none focus:ring-2 focus:ring-red-500 border border-slate-700"
                required
              >
                <option value="">Select status</option>
                {GAME_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Rating {rating ? `(${rating}/10)` : "(optional)"}</p>
                <RatingSelector value={rating} onChange={setRating} />
              </div>

              <textarea
                placeholder="Write a review (optional)"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full p-3 rounded bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 resize-none border border-slate-700"
              />

              <div className="border-t border-slate-700 pt-4 mt-4">
                <p className="text-slate-400 text-sm mb-3">Diary Entry (optional)</p>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={diaryDate}
                    onChange={(e) => setDiaryDate(e.target.value)}
                    className="w-full p-3 rounded bg-slate-800 text-white outline-none focus:ring-2 focus:ring-red-500 border border-slate-700"
                  />
                  <textarea
                    placeholder="Quick note (optional)"
                    value={diaryNote}
                    onChange={(e) => setDiaryNote(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full p-3 rounded bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 resize-none border border-slate-700"
                  />
                </div>
              </div>

              <button
                onClick={handleAddToLibrary}
                className="px-6 py-3 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                {existingEntry ? "Update" : "Add to Library"}
              </button>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-slate-400 mt-8 text-center">
            <span onClick={() => navigate("/login")} className="text-red-400 hover:underline cursor-pointer">Login</span>
            {" "}to add this game to your library
          </p>
        )}
      </div>
    </div>
  )
}