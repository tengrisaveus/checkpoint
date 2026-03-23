import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { GAME_STATUSES } from "../types";
import type { Game } from "../types";
import { getCoverUrl, getYear } from "../utils";
import RatingSelector from "../components/RatingSelector";

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/games/${id}`)
      .then((res) => setGame(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToLibrary = async () => {
    if (!status) return;
    setSuccess("");
    setError("");
    try {
      await api.post("/library", {
        game_id: Number(id),
        status,
        rating: rating,
        review: review || null,
      });
      setSuccess("Added to library!");
    } catch {
      setError("Already in library or error occurred");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-gray-400 p-8">
        Loading...
      </div>
    );
  if (!game) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-6 inline-block"
        >
          ← Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {getCoverUrl(game) ? (
            <img
              src={getCoverUrl(game)!}
              alt={game.name}
              className="w-64 h-80 object-cover rounded-lg"
            />
          ) : (
            <div className="w-64 h-80 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
              No Cover
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{game.name}</h1>
            <p className="text-gray-400 mt-2">
              {getYear(game.first_release_date)}
              {game.genres && ` · ${game.genres.map((g) => g.name).join(", ")}`}
            </p>
            {game.platforms && (
              <p className="text-gray-500 text-sm mt-1">
                {game.platforms.map((p) => p.name).join(", ")}
              </p>
            )}
            {game.involved_companies && (
              <p className="text-gray-500 text-sm mt-1">
                {game.involved_companies.map((c) => c.company.name).join(", ")}
              </p>
            )}
            <div className="flex gap-3 mt-3 flex-wrap">
              {game.aggregated_rating && (
                <span className="bg-green-400/20 text-green-400 px-3 py-1 rounded text-sm font-medium">
                  Critic: {game.aggregated_rating.toFixed(0)}/100
                </span>
              )}
            </div>
            {game.summary && (
              <p className="text-gray-300 mt-4">{game.summary}</p>
            )}
          </div>
        </div>

        {user && (
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Add to Library
            </h2>

            {success && (
              <p className="bg-green-500/20 text-green-400 p-3 rounded mb-4">
                {success}
              </p>
            )}
            {error && (
              <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select status</option>
                {GAME_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="space-y-1">
                <p className="text-gray-400 text-sm">
                  Rating {rating ? `(${rating}/10)` : "(optional)"}
                </p>
                <RatingSelector value={rating} onChange={setRating} />
              </div>

              <textarea
                placeholder="Write a review (optional)"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <button
                onClick={handleAddToLibrary}
                className="px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Add to Library
              </button>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-gray-400 mt-8 text-center">
            <span
              onClick={() => navigate("/login")}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Login
            </span>{" "}
            to add this game to your library
          </p>
        )}
      </div>
    </div>
  );
}
