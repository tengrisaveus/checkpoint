import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { GAME_STATUSES } from "../types";
import type { Game, LibraryEntry } from "../types";
import { getCoverUrl, getYear } from "../utils";
import RatingSelector from "../components/RatingSelector";
import Toast from "../components/Toast";
import { DetailSkeleton } from "../components/Skeleton";
import PlatformIcon from "../components/PlatformIcon";
import StoreLink from "../components/StoreLink";
import useTitle from "../hooks/useTitle";
import AddToList from "../components/AddToList";

function getBackdropUrl(game: Game): string | null {
  const source = game.artworks?.[0] || game.screenshots?.[0];
  if (!source?.url) return null;
  return `https:${source.url.replace("t_thumb", "t_1080p")}`;
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-lg transition-all duration-200 ${
        active
          ? "bg-fuchsia-500/15 text-fuchsia-400"
          : "text-[#8a6baa] hover:bg-white/5 hover:text-[#c4a8d8]"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] uppercase tracking-widest font-medium">
        {label}
      </span>
    </button>
  );
}

type ActivePanel = null | "library" | "diary" | "list";

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
  const [existingEntry, setExistingEntry] = useState<LibraryEntry | null>(null);
  const [diaryDate, setDiaryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [diaryNote, setDiaryNote] = useState("");
  const [expandSummary, setExpandSummary] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [similarGames, setSimilarGames] = useState<Game[]>([]);

  useTitle(game?.name || "Loading...");

  useEffect(() => {
    api
      .get(`/games/${id}`)
      .then((res) => setGame(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/library")
      .then((res) => {
        const found = res.data.find(
          (e: LibraryEntry) => e.game_id === Number(id),
        );
        if (found) {
          setExistingEntry(found);
          setStatus(found.status);
          setRating(found.rating);
          setReview(found.review || "");
        }
      })
      .catch(() => {});
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/games/${id}/similar`)
      .then((res) => setSimilarGames(res.data))
      .catch(() => {});
  }, [id]);

  const handleAddToLibrary = async () => {
    if (!status) return;
    setSuccess("");
    setError("");
    try {
      if (existingEntry) {
        await api.put(`/library/${id}`, {
          status,
          rating: rating,
          review: review || null,
        });
        setExistingEntry({ ...existingEntry, status, rating, review });
      } else {
        await api.post("/library", {
          game_id: Number(id),
          status,
          rating: rating,
          review: review || null,
        });
      }

      if (diaryDate) {
        await api.post("/diary", {
          game_id: Number(id),
          played_at: diaryDate,
          status,
          rating: rating,
          note: diaryNote || null,
        });
      }

      setSuccess(
        existingEntry ? "Updated & logged!" : "Added to library & diary!",
      );
      setDiaryNote("");
      setActivePanel(null);
    } catch {
      setError("Something went wrong");
    }
  };

  const handleDiaryOnly = async () => {
    if (!diaryDate) return;
    setSuccess("");
    setError("");
    try {
      await api.post("/diary", {
        game_id: Number(id),
        played_at: diaryDate,
        status: status || null,
        rating: rating,
        note: diaryNote || null,
      });
      setSuccess("Diary entry added!");
      setDiaryNote("");
      setActivePanel(null);
    } catch {
      setError("Something went wrong");
    }
  };

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0d0015] p-8">
        <div className="max-w-5xl mx-auto">
          <DetailSkeleton />
        </div>
      </div>
    );
  if (!game) return null;

  const backdrop = getBackdropUrl(game);
  const storeLinks =
    game.websites?.filter((w) => [1, 13, 16, 17].includes(w.category)) || [];
  const summaryLong = (game.summary?.length || 0) > 300;
  const developer = game.involved_companies?.find((c) => c.company)?.company
    .name;

  return (
    <div className="min-h-screen bg-[#0d0015]">
      {success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setSuccess("")}
        />
      )}
      {error && (
        <Toast message={error} type="error" onClose={() => setError("")} />
      )}

      {/* === BACKDROP === */}
      <div className="relative h-[280px] md:h-[420px] overflow-hidden">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover scale-105 blur-[2px]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a0a2e] to-[#0d0015]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0015] via-[#0d0015]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0015]/50 to-transparent" />
        <div className="absolute inset-0 bg-[#0d0015]/20" />
      </div>

      {/* === MAIN CONTENT === */}
      <div className="max-w-5xl mx-auto px-4 -mt-48 md:-mt-64 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-white/50 hover:text-white text-sm mb-6 inline-flex items-center gap-1.5 transition"
        >
          <span className="text-lg">←</span> Back
        </button>

        {/* === HERO: Cover + Info === */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Cover */}
          <div className="shrink-0 self-start">
            {getCoverUrl(game) ? (
              <img
                src={getCoverUrl(game)!}
                alt={game.name}
                className="w-44 md:w-56 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
              />
            ) : (
              <div className="w-44 md:w-56 aspect-[3/4] bg-[#1a0a2e] rounded-lg flex items-center justify-center text-[#8a6baa] ring-1 ring-white/10">
                No Cover
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-3xl md:text-[2.5rem] font-bold text-white leading-tight tracking-tight">
              {game.name}
            </h1>

            <div className="flex items-center gap-2 mt-2.5 text-sm flex-wrap">
              {getYear(game.first_release_date) && (
                <span className="text-white/70 font-medium">
                  {getYear(game.first_release_date)}
                </span>
              )}
              {developer && (
                <>
                  <span className="text-[#3d2b5e]">•</span>
                  <span className="text-[#a78bba]">{developer}</span>
                </>
              )}
              {game.involved_companies &&
                game.involved_companies.length > 1 && (
                  <>
                    <span className="text-[#3d2b5e]">•</span>
                    <span className="text-[#8a6baa] text-xs">
                      +{game.involved_companies.length - 1} more
                    </span>
                  </>
                )}
            </div>

            {/* Genres */}
            {game.genres && (
              <div className="flex gap-1.5 mt-4 flex-wrap">
                {game.genres.map((g) => (
                  <span
                    key={g.name}
                    className="px-2.5 py-1 rounded-full text-xs font-medium text-fuchsia-300/90 bg-fuchsia-500/10 border border-fuchsia-500/20"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Platforms */}
            {game.platforms && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {game.platforms.map((p) => (
                  <PlatformIcon
                    key={p.name}
                    name={p.name}
                    abbreviation={p.abbreviation}
                  />
                ))}
              </div>
            )}

            {/* Score + Store Links */}
            <div className="flex items-center gap-4 mt-5 flex-wrap">
              {game.aggregated_rating && (
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ring-2 ${
                      game.aggregated_rating >= 75
                        ? "bg-green-500/15 text-green-400 ring-green-500/30"
                        : game.aggregated_rating >= 50
                          ? "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30"
                          : "bg-red-500/15 text-red-400 ring-red-500/30"
                    }`}
                  >
                    {game.aggregated_rating.toFixed(0)}
                  </div>
                  <span className="text-[#8a6baa] text-xs uppercase tracking-wider">
                    Critic
                  </span>
                </div>
              )}

              {storeLinks.length > 0 && (
                <>
                  {game.aggregated_rating && (
                    <div className="w-px h-6 bg-[#2d1b4e]" />
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    {storeLinks.map((w, i) => (
                      <StoreLink key={i} url={w.url} category={w.category} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Summary */}
            {game.summary && (
              <div className="mt-5">
                <p
                  className={`text-[#c4a8d8]/85 text-sm leading-relaxed ${
                    !expandSummary && summaryLong ? "line-clamp-4" : ""
                  }`}
                >
                  {game.summary}
                </p>
                {summaryLong && (
                  <button
                    onClick={() => setExpandSummary(!expandSummary)}
                    className="text-fuchsia-400 text-xs mt-1.5 hover:text-fuchsia-300 transition font-medium"
                  >
                    {expandSummary ? "Show less" : "Read more..."}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === ACTION BAR === */}
        {user && (
          <div className="mt-10 border border-[#2d1b4e] rounded-xl bg-[#1a0a2e]/50 backdrop-blur-sm overflow-hidden">
            {/* Library status badge */}
            {existingEntry && (
              <div className="flex items-center gap-2 px-5 pt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                <span className="text-fuchsia-400 text-xs font-medium uppercase tracking-widest">
                  {existingEntry.status}
                </span>
                {existingEntry.rating && (
                  <span className="text-yellow-400/80 text-xs ml-auto">
                    ★ {existingEntry.rating}/10
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-1 p-3">
              <ActionButton
                icon={existingEntry ? "✏️" : "🎮"}
                label={existingEntry ? "Edit" : "Library"}
                active={activePanel === "library"}
                onClick={() => togglePanel("library")}
              />
              <ActionButton
                icon="📖"
                label="Diary"
                active={activePanel === "diary"}
                onClick={() => togglePanel("diary")}
              />
              <ActionButton
                icon="📋"
                label="List"
                active={activePanel === "list"}
                onClick={() => togglePanel("list")}
              />
            </div>

            {/* Library Panel */}
            {activePanel === "library" && (
              <div className="border-t border-[#2d1b4e] p-5 space-y-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#0d0015] text-white outline-none focus:ring-2 focus:ring-fuchsia-500/50 border border-[#2d1b4e] text-sm"
                  required
                >
                  <option value="">Select status</option>
                  {GAME_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div>
                  <p className="text-[#8a6baa] text-xs uppercase tracking-wider mb-2">
                    Rating {rating ? `— ${rating}/10` : ""}
                  </p>
                  <RatingSelector value={rating} onChange={setRating} />
                </div>

                <textarea
                  placeholder="Write a review..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full p-3 rounded-lg bg-[#0d0015] text-white placeholder-[#8a6baa]/50 outline-none focus:ring-2 focus:ring-fuchsia-500/50 resize-none border border-[#2d1b4e] text-sm"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleAddToLibrary}
                    disabled={!status}
                    className="px-6 py-2.5 rounded-lg bg-fuchsia-500 text-white text-sm font-semibold hover:bg-fuchsia-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {existingEntry ? "Update" : "Add to Library"}
                  </button>
                </div>
              </div>
            )}

            {/* Diary Panel */}
            {activePanel === "diary" && (
              <div className="border-t border-[#2d1b4e] p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#8a6baa] text-xs uppercase tracking-wider mb-2">
                      Date Played
                    </p>
                    <input
                      type="date"
                      value={diaryDate}
                      onChange={(e) => setDiaryDate(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#0d0015] text-white outline-none focus:ring-2 focus:ring-fuchsia-500/50 border border-[#2d1b4e] text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[#8a6baa] text-xs uppercase tracking-wider mb-2">
                      Note
                    </p>
                    <input
                      type="text"
                      placeholder="Quick thoughts..."
                      value={diaryNote}
                      onChange={(e) => setDiaryNote(e.target.value)}
                      maxLength={500}
                      className="w-full p-3 rounded-lg bg-[#0d0015] text-white placeholder-[#8a6baa]/50 outline-none focus:ring-2 focus:ring-fuchsia-500/50 border border-[#2d1b4e] text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleDiaryOnly}
                    disabled={!diaryDate}
                    className="px-6 py-2.5 rounded-lg bg-fuchsia-500 text-white text-sm font-semibold hover:bg-fuchsia-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Log Entry
                  </button>
                </div>
              </div>
            )}

            {/* List Panel */}
            {activePanel === "list" && (
              <div className="border-t border-[#2d1b4e] p-5">
                <AddToList gameId={Number(id)} />
              </div>
            )}
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="mt-10 border border-[#2d1b4e] rounded-xl bg-[#1a0a2e]/50 p-8 text-center">
            <p className="text-[#8a6baa] text-sm">
              <span
                onClick={() => navigate("/login")}
                className="text-fuchsia-400 hover:text-fuchsia-300 cursor-pointer font-medium transition"
              >
                Sign in
              </span>{" "}
              to track this game
            </p>
          </div>
        )}
        {similarGames.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[15px] font-medium text-white mb-3">Similar games</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {similarGames.slice(0, 5).map((g) => (
                <div
                  key={g.id}
                  onClick={() => navigate(`/game/${g.id}`)}
                  className="cursor-pointer group"
                >
                  {getCoverUrl(g) ? (
                    <img
                      src={getCoverUrl(g)!}
                      alt={g.name}
                      className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 group-hover:ring-fuchsia-500 transition"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-[#1a0a2e] rounded-lg flex items-center justify-center text-[#8a6baa] text-xs">
                      {g.name}
                    </div>
                  )}
                  <p className="text-[11px] text-[#c4a8d8] mt-1.5 truncate">{g.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  );
}
