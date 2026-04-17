import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import type { LibraryEntry } from "../types";
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

interface MonthlyData {
  month: string;
  label: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
};

export default function Profile() {
  useTitle("Profile");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<LibraryEntryWithGame[]>([]);
  const [favorites, setFavorites] = useState<LibraryEntryWithGame[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/library"),
      api.get("/library/favorites"),
      api.get("/library/stats"),
      api.get("/diary/monthly"),
    ])
      .then(([libRes, favRes, statsRes, monthlyRes]) => {
        setLibrary(libRes.data);
        setFavorites(favRes.data);
        setStats(statsRes.data);
        setMonthly(monthlyRes.data);
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
  const maxMonthly = Math.max(...monthly.map((m) => m.count), 1);
  const completionDash = stats
    ? 163.36 - (163.36 * stats.completion_ratio) / 100
    : 163.36;

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
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

      <div className="max-w-5xl mx-auto">
        {/* Header — The Vitrine */}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-[var(--cp-surf-2)] flex items-center justify-center text-2xl font-medium text-[var(--cp-accent)]">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl text-[var(--cp-text)]">
              {user?.username}
            </h1>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}/u/${user?.username}`;
              navigator.clipboard.writeText(url);
              setSuccess("Profile link copied!");
            }}
            className="px-4 py-2 rounded-sm border border-[var(--cp-border)] text-[var(--cp-text-dim)] text-sm hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-accent)] transition"
          >
            Share
          </button>
        </div>

        {/* Stats line */}
        {stats && stats.total_games > 0 && (
          <p className="font-mono text-[var(--cp-text-dim)] text-[11px] mb-8 tracking-wide">
            {stats.total_games} games · {stats.by_status["Completed"] || 0} completed · avg ★ {stats.average_rating || "—"} · joined {new Date(user?.created_at || "").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        )}

        {/* Favorites */}
        <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">
          FAVORITE GAMES
        </p>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {slots.map((i) => {
            const fav = favorites[i];
            if (fav) {
              return (
                <div key={fav.game_id}>
                  <div className="relative group">
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
                        <div className="w-full aspect-[3/4] bg-[var(--cp-surf-2)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-sm cover-placeholder italic">
                          {fav.game_name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(fav.game_id)}
                      className="absolute top-2 right-2 bg-black/60 text-[var(--cp-accent)] rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--cp-text-dim)] mt-1.5 truncate">
                    {fav.game_name}
                  </p>
                </div>
              );
            }
            return (
              <div key={`empty-${i}`}>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full aspect-[3/4] bg-[var(--cp-surf)] rounded-md border-2 border-dashed border-[var(--cp-border)] flex items-center justify-center text-[var(--cp-text-dimmer)] hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)] transition cursor-pointer text-2xl"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        {stats && stats.total_games > 0 && (
          <>
            {/* Completion + Avg Rating — The Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[var(--cp-surf)] rounded-lg p-5 border border-[var(--cp-border)]">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--cp-surf-2)" strokeWidth="6" />
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#22c55e" strokeWidth="6"
                        strokeDasharray="163.36" strokeDashoffset={completionDash} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--cp-text)] font-mono font-medium text-sm">
                      {stats.completion_ratio}%
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider">
                      Completion rate
                    </p>
                    <p className="text-[var(--cp-text-dim)] text-sm mt-1">
                      {stats.by_status["Completed"] || 0} of {stats.total_games} games completed
                    </p>
                  </div>
                </div>
              </div>

              {/* Status breakdown mini */}
              <div className="bg-[var(--cp-surf)] rounded-lg p-5 border border-[var(--cp-border)]">
                <p className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider mb-3">STATUS</p>
                {Object.entries(stats.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[status] || "#6b7280" }} />
                    <span className="text-[12px] text-[var(--cp-text-dim)] w-24">{status}</span>
                    <div className="flex-1 h-1.5 bg-[var(--cp-bg)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / stats.total_games) * 100}%`,
                          backgroundColor: STATUS_COLORS[status] || "#6b7280",
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--cp-text-dimmer)] w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Small stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-[var(--cp-surf)] rounded-lg p-3 border border-[var(--cp-border)] text-center">
                <p className="text-xl font-medium text-[var(--cp-text)] font-mono">{stats.total_games}</p>
                <p className="font-mono text-[10px] text-[var(--cp-text-dimmer)] uppercase tracking-wider mt-1">Total</p>
              </div>
              <div className="bg-[var(--cp-surf)] rounded-lg p-3 border border-[var(--cp-border)] text-center">
                <p className="text-xl font-medium text-green-400 font-mono">{stats.by_status["Completed"] || 0}</p>
                <p className="font-mono text-[10px] text-[var(--cp-text-dimmer)] uppercase tracking-wider mt-1">Completed</p>
              </div>
              <div className="bg-[var(--cp-surf)] rounded-lg p-3 border border-[var(--cp-border)] text-center">
                <p className="text-xl font-medium text-blue-400 font-mono">{stats.by_status["Playing"] || 0}</p>
                <p className="font-mono text-[10px] text-[var(--cp-text-dimmer)] uppercase tracking-wider mt-1">Playing</p>
              </div>
              <div className="bg-[var(--cp-surf)] rounded-lg p-3 border border-[var(--cp-border)] text-center">
                <p className="text-xl font-medium text-[var(--cp-star)] font-mono">{stats.average_rating || "—"}</p>
                <p className="font-mono text-[10px] text-[var(--cp-text-dimmer)] uppercase tracking-wider mt-1">Avg Rating</p>
              </div>
            </div>

            {/* Top Genres */}
            {stats.top_genres.length > 0 && (
              <>
                <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">TOP GENRES</p>
                <div className="bg-[var(--cp-surf)] rounded-lg p-5 border border-[var(--cp-border)] mb-8">
                  {stats.top_genres.slice(0, 6).map((genre) => {
                    const maxCount = stats.top_genres[0]?.count || 1
                    return (
                      <div key={genre.name} className="flex items-center gap-3 mb-2 last:mb-0">
                        <span className="text-[12px] text-[var(--cp-text-dim)] w-28 truncate">{genre.name}</span>
                        <div className="flex-1 h-1.5 bg-[var(--cp-bg)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--cp-accent-2)]"
                            style={{ width: `${(genre.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-[var(--cp-text-dimmer)] w-6 text-right">{genre.count}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Monthly Activity */}
            {monthly.some((m) => m.count > 0) && (
              <>
                <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">MONTHLY ACTIVITY</p>
                <div className="bg-[var(--cp-surf)] rounded-lg p-5 border border-[var(--cp-border)] mb-8">
                  <div className="flex items-end gap-2 h-24">
                    {monthly.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: m.count > 0 ? `${(m.count / maxMonthly) * 80}px` : "4px",
                            opacity: m.count > 0 ? 1 : 0.2,
                            backgroundColor: "var(--cp-accent-2)",
                          }}
                        />
                        <span className="font-mono text-[10px] text-[var(--cp-text-dimmer)]">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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
