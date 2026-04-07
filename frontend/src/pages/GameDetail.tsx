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
import PlatformIcon from "../components/PlatformIcon"
import StoreLink from "../components/StoreLink"
import useTitle from "../hooks/useTitle"

function getBackdropUrl(game: Game): string | null {
  const source = game.artworks?.[0] || game.screenshots?.[0]
  if (!source?.url) return null
  return `https:${source.url.replace("t_thumb", "t_1080p")}`
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
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto">
        <DetailSkeleton />
      </div>
    </div>
  )
  if (!game) return null

  const backdrop = getBackdropUrl(game)
  const storeLinks = game.websites?.filter((w) => [1, 13, 16, 17].includes(w.category)) || []

  return (
    <div className="min-h-screen bg-[#0d0015]">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      {/* Backdrop */}
      {backdrop && (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0015] via-[#0d0015]/60 to-transparent" />
        </div>
      )}

      <div className={`max-w-4xl mx-auto px-4 ${backdrop ? "-mt-32 relative z-10" : "pt-8"}`}>
        <button
          onClick={() => navigate(-1)}
          className="text-[#a78bba] hover:text-white mb-6 inline-block"
        >
          ← Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {getCoverUrl(game) ? (
            <img src={getCoverUrl(game)!} alt={game.name} className="w-64 h-80 object-cover rounded-lg shadow-2xl" />
          ) : (
            <div className="w-64 h-80 bg-[#2d1b4e] rounded-lg flex items-center justify-center text-[#8a6baa]">No Cover</div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{game.name}</h1>

            <p className="text-[#a78bba] mt-2">
              {getYear(game.first_release_date)}
              {game.involved_companies && ` · ${game.involved_companies.map((c) => c.company.name).join(", ")}`}
            </p>

            {/* Genres */}
            {game.genres && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {game.genres.map((g) => (
                  <span key={g.name} className="px-2 py-1 rounded text-xs font-medium bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Platforms */}
            {game.platforms && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {game.platforms.map((p) => (
                  <PlatformIcon key={p.name} name={p.name} abbreviation={p.abbreviation} />
                ))}
              </div>
            )}

            {/* Scores */}
            {game.aggregated_rating && (
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">{game.aggregated_rating.toFixed(0)}</span>
                  </div>
                  <span className="text-[#8a6baa] text-sm">Critic Score</span>
                </div>
              </div>
            )}

            {game.summary && <p className="text-[#c4a8d8] mt-4 leading-relaxed">{game.summary}</p>}

            {/* Store Links */}
            {storeLinks.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {storeLinks.map((w, i) => (
                  <StoreLink key={i} url={w.url} category={w.category} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add to Library Form */}
        {user && (
          <div className="bg-[#1a0a2e] rounded-lg p-6 mt-8 border border-[#2d1b4e]">
            <h2 className="text-xl font-semibold text-white mb-4">
              {existingEntry ? "In Your Library" : "Add to Library"}
            </h2>

            <div className="space-y-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 rounded bg-[#2d1b4e] text-white outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
                required
              >
                <option value="">Select status</option>
                {GAME_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="space-y-1">
                <p className="text-[#a78bba] text-sm">Rating {rating ? `(${rating}/10)` : "(optional)"}</p>
                <RatingSelector value={rating} onChange={setRating} />
              </div>

              <textarea
                placeholder="Write a review (optional)"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none border border-[#3d2b5e]"
              />

              <div className="border-t border-[#3d2b5e] pt-4 mt-4">
                <p className="text-[#a78bba] text-sm mb-3">Diary Entry (optional)</p>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={diaryDate}
                    onChange={(e) => setDiaryDate(e.target.value)}
                    className="w-full p-3 rounded bg-[#2d1b4e] text-white outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
                  />
                  <textarea
                    placeholder="Quick note (optional)"
                    value={diaryNote}
                    onChange={(e) => setDiaryNote(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none border border-[#3d2b5e]"
                  />
                </div>
              </div>

              <button
                onClick={handleAddToLibrary}
                className="px-6 py-3 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition"
              >
                {existingEntry ? "Update" : "Add to Library"}
              </button>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-[#a78bba] mt-8 text-center pb-8">
            <span onClick={() => navigate("/login")} className="text-fuchsia-400 hover:underline cursor-pointer">Login</span>
            {" "}to add this game to your library
          </p>
        )}
      </div>
    </div>
  )
}