import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import type { LibraryEntry, DiaryEntry } from "../types";
import FavoritePicker from "../components/FavoritePicker";
import Toast from "../components/Toast";
import useTitle from "../hooks/useTitle";

interface LibraryEntryWithGame extends LibraryEntry {
  game_name: string;
  game_cover_url: string | null;
  is_favorite: boolean;
}

interface StatsData {
  total_games: number;
  by_status: Record<string, number>;
  average_rating: number | null;
  rated_count: number;
  reviewed_count: number;
  completion_ratio: number;
  top_genres: { name: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
};

function monthsBetween(iso: string) {
  const then = new Date(iso);
  const now = new Date();
  return (
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth())
  );
}

function formatActivityDate(iso: string) {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .toUpperCase();
}

export default function Profile() {
  useTitle("Profile");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<LibraryEntryWithGame[]>([]);
  const [favorites, setFavorites] = useState<LibraryEntryWithGame[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/library"),
      api.get("/library/favorites"),
      api.get("/library/stats"),
      api.get("/diary/"),
    ])
      .then(([libRes, favRes, statsRes, diaryRes]) => {
        setLibrary(libRes.data);
        setFavorites(favRes.data);
        setStats(statsRes.data);
        setDiary(diaryRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCoverUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `https:${url}`;
  };

  const handleAddFavorite = async (gameId: number) => {
    const newFavIds = [...favorites.map((f) => f.game_id), gameId];
    try {
      await api.put("/library/favorites", newFavIds);
      const added = library.find((e) => e.game_id === gameId);
      if (added) setFavorites([...favorites, added]);
      setPickerOpen(false);
      setSuccess("Favorite added!");
    } catch {
      setError("Failed to update favorites");
    }
  };

  const handleRemoveFavorite = async (gameId: number) => {
    const newFavIds = favorites
      .filter((f) => f.game_id !== gameId)
      .map((f) => f.game_id);
    try {
      await api.put("/library/favorites", newFavIds);
      setFavorites(favorites.filter((f) => f.game_id !== gameId));
      setSuccess("Favorite removed!");
    } catch {
      setError("Failed to update favorites");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--cp-bg)] text-[var(--cp-text-dim)] p-8">
        Loading...
      </div>
    );

  const slots = [0, 1, 2, 3];
  const completionDash = stats
    ? 163.36 - (163.36 * stats.completion_ratio) / 100
    : 163.36;

  const joinedIso = user?.created_at || "";
  const joinedLabel = joinedIso
    ? new Date(joinedIso).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";
  const monthsMember = joinedIso ? monthsBetween(joinedIso) : 0;

  const sidebarStats: [string, string | number][] = [
    ["GAMES", stats?.total_games ?? 0],
    ["COMPLETED", stats?.by_status["Completed"] ?? 0],
    ["PLAYING", stats?.by_status["Playing"] ?? 0],
    ["BACKLOG", stats?.by_status["Want to Play"] ?? 0],
    ["AVG RATING", stats?.average_rating ? `★ ${stats.average_rating}` : "—"],
    ["DIARY", diary.length],
  ];

  const recentActivity = diary.slice(0, 6);

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]">
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

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 lg:gap-0">
          {/* LEFT SIDEBAR */}
          <aside className="lg:pr-8 lg:border-r lg:border-[var(--cp-border)] lg:sticky lg:top-8 self-start">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--cp-accent)] to-[var(--cp-accent-2)] flex items-center justify-center font-display text-5xl text-white mb-4">
              {user?.username?.[0]?.toLowerCase()}
            </div>
            <h1 className="font-display text-3xl leading-none text-[var(--cp-text)]">
              {user?.username}
            </h1>
            <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--cp-text-dimmer)] mt-1">
              @{user?.username?.toUpperCase()}
            </p>

            <div className="mt-5 pt-4 border-t border-[var(--cp-border)]">
              {sidebarStats.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between items-center py-[7px] border-b border-dashed border-[var(--cp-border)] last:border-b-0"
                >
                  <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--cp-text-dimmer)]">
                    {k}
                  </span>
                  <span className="font-mono text-[12px] text-[var(--cp-text)]">
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {joinedIso && (
              <div className="mt-5">
                <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-2">
                  Joined
                </p>
                <p className="text-[12px] text-[var(--cp-text-dim)]">
                  {joinedLabel}
                  {monthsMember > 0 && ` · ${monthsMember} months`}
                </p>
              </div>
            )}

            <div className="mt-6 mb-8 lg:mb-0">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/u/${user?.username}`;
                  navigator.clipboard.writeText(url);
                  setSuccess("Profile link copied!");
                }}
                className="w-full py-2 rounded-sm border border-[var(--cp-border)] text-[var(--cp-text-dim)] text-[11px] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-accent)] transition"
              >
                Share profile
              </button>
            </div>
          </aside>

          {/* RIGHT MAIN */}
          <main className="lg:pl-9">
            {/* Favorites */}
            <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">
              ▸ FOUR FAVORITES
            </p>
            <div className="grid grid-cols-4 gap-2.5 mb-8">
              {slots.map((i) => {
                const fav = favorites[i];
                if (fav) {
                  return (
                    <div key={fav.game_id} className="relative group">
                      <div
                        onClick={() => navigate(`/game/${fav.game_id}`)}
                        className="cursor-pointer"
                      >
                        {getCoverUrl(fav.game_cover_url) ? (
                          <img
                            src={getCoverUrl(fav.game_cover_url)!}
                            alt={fav.game_name}
                            className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                          />
                        ) : (
                          <div className="w-full aspect-[3/4] bg-[var(--cp-surf-2)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-sm cover-placeholder p-2 text-center">
                            {fav.game_name}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(fav.game_id)}
                        className="absolute top-2 right-2 bg-black/60 text-[var(--cp-accent)] rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm"
                        aria-label="Remove favorite"
                      >
                        ✕
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={`empty-${i}`}
                    onClick={() => setPickerOpen(true)}
                    className="w-full aspect-[3/4] bg-[var(--cp-surf)] rounded-md border-2 border-dashed border-[var(--cp-border)] flex items-center justify-center text-[var(--cp-text-dimmer)] hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)] transition text-2xl"
                    aria-label="Add favorite"
                  >
                    +
                  </button>
                );
              })}
            </div>

            {/* Progress */}
            {stats && stats.total_games > 0 && (
              <>
                <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">
                  ▸ PROGRESS
                </p>
                <div className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-xl p-4 mb-8">
                  <div className="flex items-center gap-5 pb-4 mb-4 border-b border-[var(--cp-border)]">
                    <div className="relative w-[60px] h-[60px] shrink-0">
                      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="var(--cp-surf-2)"
                          strokeWidth="6"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="6"
                          strokeDasharray="163.36"
                          strokeDashoffset={completionDash}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-[13px] text-[var(--cp-text)]">
                        {stats.completion_ratio}%
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[var(--cp-text)] font-medium">
                        Completion rate
                      </div>
                      <div className="text-[11px] text-[var(--cp-text-dim)] mt-0.5">
                        {stats.by_status["Completed"] || 0} of{" "}
                        {stats.total_games} games
                      </div>
                    </div>
                  </div>

                  {Object.entries(stats.by_status).map(([status, count]) => {
                    const color = STATUS_COLORS[status] || "#6b7280";
                    return (
                      <div
                        key={status}
                        className="flex items-center gap-2.5 mb-[7px] last:mb-0"
                      >
                        <span
                          className="status-dot"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[11px] text-[var(--cp-text-dim)] w-20">
                          {status}
                        </span>
                        <div className="flex-1 h-[3px] bg-[var(--cp-bg)] rounded-sm overflow-hidden">
                          <div
                            className="h-full rounded-sm"
                            style={{
                              width: `${
                                (count / stats.total_games) * 100
                              }%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[var(--cp-text-dimmer)] w-6 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Recent activity */}
            {recentActivity.length > 0 && (
              <>
                <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">
                  ▸ RECENT ACTIVITY
                </p>
                <div className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-xl p-2 mb-8">
                  {recentActivity.map((e, i) => {
                    const isLast = i === recentActivity.length - 1;
                    const statusColor = STATUS_COLORS[e.status];
                    const note =
                      e.note?.trim()
                        ? `"${e.note}"`
                        : e.rating
                          ? `Rated ${"★".repeat(Math.round(e.rating / 2))}`
                          : e.status;
                    const cover = getCoverUrl(e.game_cover_url);
                    return (
                      <div
                        key={e.id}
                        onClick={() => navigate(`/game/${e.game_id}`)}
                        className={`grid grid-cols-[44px_32px_1fr_auto] gap-2.5 items-center px-2 py-2.5 cursor-pointer hover:bg-[var(--cp-surf-2)]/40 rounded-md transition ${
                          isLast
                            ? ""
                            : "border-b border-dashed border-[var(--cp-border)]"
                        }`}
                      >
                        <div className="font-mono text-[10px] tracking-[0.08em] text-[var(--cp-text-dimmer)]">
                          {formatActivityDate(e.played_at)}
                        </div>
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="w-6 h-8 object-cover rounded-sm"
                          />
                        ) : (
                          <div className="w-6 h-8 rounded-sm bg-[var(--cp-surf-2)]" />
                        )}
                        <div className="min-w-0">
                          <div className="text-[12px] text-[var(--cp-text)] font-medium truncate">
                            {e.game_name}
                          </div>
                          <div className="text-[11px] text-[var(--cp-text-dim)] mt-0.5 truncate">
                            {note}
                          </div>
                        </div>
                        {statusColor && (
                          <span
                            className="font-mono text-[9.5px] tracking-[0.08em]"
                            style={{ color: statusColor }}
                          >
                            {e.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {stats && stats.total_games === 0 && (
              <p className="text-[var(--cp-text-dim)] text-center font-display text-xl italic mt-12">
                No games in library yet.
                <span
                  onClick={() => navigate("/search")}
                  className="text-[var(--cp-accent)] cursor-pointer hover:brightness-110 transition not-italic text-base ml-2"
                >
                  Search for games →
                </span>
              </p>
            )}
          </main>
        </div>
      </div>

      {pickerOpen && (
        <FavoritePicker
          library={library}
          currentFavorites={favorites.map((f) => f.game_id)}
          onSelect={handleAddFavorite}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
