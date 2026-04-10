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
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

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
      <div className="min-h-screen bg-[#0d0015] text-[#a78bba] p-8">
        Loading...
      </div>
    );

  const slots = [0, 1, 2, 3];
  const maxMonthly = Math.max(...monthly.map((m) => m.count), 1);
  const completionDash = stats
    ? 163.36 - (163.36 * stats.completion_ratio) / 100
    : 163.36;

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#2d1b4e] flex items-center justify-center text-2xl font-medium text-fuchsia-400">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-medium text-white">
              {user?.username}
            </h1>
            {user?.bio && (
              <p className="text-[#a78bba] text-sm mt-0.5">{user.bio}</p>
            )}
            <p className="text-[#8a6baa] text-xs mt-1">
              {stats?.total_games || 0} games in library
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditBio(user?.bio || "");
                setEditAvatar(user?.avatar_url || "");
                setEditing(true);
              }}
              className="px-4 py-2 rounded-lg border border-[#2d1b4e] text-[#a78bba] text-sm hover:border-fuchsia-500/50 hover:text-fuchsia-400 transition"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/u/${user?.username}`;
                navigator.clipboard.writeText(url);
                setSuccess("Profile link copied!");
              }}
              className="px-4 py-2 rounded-lg border border-[#2d1b4e] text-[#a78bba] text-sm hover:border-fuchsia-500/50 hover:text-fuchsia-400 transition"
            >
              Share
            </button>
          </div>
        </div>

        {/* Favorites */}
        <h2 className="text-[15px] font-medium text-white mb-3">
          Favorite games
        </h2>
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
                          className="w-full aspect-[3/4] object-cover rounded-[10px]"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-[10px] flex items-center justify-center text-[#8a6baa] text-sm">
                          {fav.game_name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(fav.game_id)}
                      className="absolute top-2 right-2 bg-black/60 text-fuchsia-400 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-[#c4a8d8] mt-1.5 truncate">
                    {fav.game_name}
                  </p>
                </div>
              );
            }
            return (
              <div key={`empty-${i}`}>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full aspect-[3/4] bg-[#1a0a2e] rounded-[10px] border-2 border-dashed border-[#2d1b4e] flex items-center justify-center text-[#8a6baa] hover:border-fuchsia-500 hover:text-fuchsia-400 transition cursor-pointer text-2xl"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        {stats && stats.total_games > 0 && (
          <>
            {/* Completion + Avg Rating */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-2 bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        stroke="#2d1b4e"
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
                    <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                      {stats.completion_ratio}%
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#8a6baa]">
                      Completion rate
                    </p>
                    <p className="text-[13px] text-[#a78bba] mt-1">
                      {stats.by_status["Completed"] || 0} of {stats.total_games}{" "}
                      games completed
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 flex flex-col items-center justify-center">
                <p className="text-3xl font-medium text-yellow-400">
                  {stats.average_rating || "—"}
                </p>
                <p className="text-[12px] text-[#8a6baa]">Avg rating</p>
              </div>
            </div>

            {/* Small stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-white">
                  {stats.total_games}
                </p>
                <p className="text-[11px] text-[#8a6baa]">Total</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-green-400">
                  {stats.by_status["Completed"] || 0}
                </p>
                <p className="text-[11px] text-[#8a6baa]">Completed</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-blue-400">
                  {stats.by_status["Playing"] || 0}
                </p>
                <p className="text-[11px] text-[#8a6baa]">Playing</p>
              </div>
              <div className="bg-[#1a0a2e] rounded-xl p-3 border border-[#2d1b4e]/50 text-center">
                <p className="text-xl font-medium text-red-400">
                  {stats.by_status["Dropped"] || 0}
                </p>
                <p className="text-[11px] text-[#8a6baa]">Dropped</p>
              </div>
            </div>

            {/* Top Genres */}
            {stats.top_genres.length > 0 && (
              <>
                <h2 className="text-[15px] font-medium text-white mb-3">
                  Top genres
                </h2>
                <div className="flex gap-2 flex-wrap mb-8">
                  {stats.top_genres.map((genre) => (
                    <span
                      key={genre.name}
                      className="px-3 py-1.5 rounded-full bg-[#1a0a2e] border border-[#2d1b4e]/50 text-[12px] text-[#c4a8d8]"
                    >
                      {genre.name}{" "}
                      <span className="text-fuchsia-400 font-medium">
                        {genre.count}
                      </span>
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Status Breakdown */}
            <h2 className="text-[15px] font-medium text-white mb-3">
              Status breakdown
            </h2>
            <div className="bg-[#1a0a2e] rounded-xl p-5 border border-[#2d1b4e]/50 mb-8">
              {Object.entries(stats.by_status).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-3 mb-2 last:mb-0"
                >
                  <span className="text-[12px] text-[#a78bba] w-24 text-right shrink-0">
                    {status}
                  </span>
                  <div className="flex-1 h-2 bg-[#0d0015] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / stats.total_games) * 100}%`,
                        backgroundColor: STATUS_COLORS[status] || "#6b7280",
                      }}
                    />
                  </div>
                  <span className="text-[12px] text-[#8a6baa] w-6">
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* Monthly Activity */}
            {monthly.some((m) => m.count > 0) && (
              <>
                <h2 className="text-[15px] font-medium text-white mb-3">
                  Monthly activity
                </h2>
                <div className="bg-[#1a0a2e] rounded-xl p-5 border border-[#2d1b4e]/50 mb-8">
                  <div className="flex items-end gap-2 h-24">
                    {monthly.map((m) => (
                      <div
                        key={m.month}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full rounded-t bg-fuchsia-500"
                          style={{
                            height:
                              m.count > 0
                                ? `${(m.count / maxMonthly) * 80}px`
                                : "4px",
                            opacity: m.count > 0 ? 1 : 0.2,
                          }}
                        />
                        <span className="text-[11px] text-[#8a6baa]">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {stats && stats.total_games === 0 && (
          <p className="text-[#a78bba] text-center">
            No games in library yet.
            <span
              onClick={() => navigate("/search")}
              className="text-fuchsia-400 hover:underline cursor-pointer ml-1"
            >
              Search for games
            </span>
          </p>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setEditing(false)}
        >
          <div
            className="bg-[#1a0a2e] rounded-xl border border-[#2d1b4e] p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium text-white mb-4">
              Edit Profile
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[#8a6baa] text-xs uppercase tracking-wider mb-2">
                  Avatar URL
                </p>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#0d0015] text-white placeholder-[#8a6baa]/50 outline-none focus:ring-2 focus:ring-fuchsia-500/50 border border-[#2d1b4e] text-sm"
                />
              </div>
              <div>
                <p className="text-[#8a6baa] text-xs uppercase tracking-wider mb-2">
                  Bio
                </p>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full p-3 rounded-lg bg-[#0d0015] text-white placeholder-[#8a6baa]/50 outline-none focus:ring-2 focus:ring-fuchsia-500/50 resize-none border border-[#2d1b4e] text-sm"
                />
                <p className="text-[#8a6baa] text-xs text-right mt-1">
                  {editBio.length}/300
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg text-[#a78bba] text-sm hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.put("/auth/me", {
                        bio: editBio || null,
                        avatar_url: editAvatar || null,
                      });
                      setSuccess("Profile updated!");
                      setEditing(false);
                      window.location.reload();
                    } catch {
                      setError("Failed to update profile");
                    }
                  }}
                  className="px-6 py-2 rounded-lg bg-fuchsia-500 text-white text-sm font-semibold hover:bg-fuchsia-600 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
