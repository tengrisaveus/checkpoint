import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import useTitle from "../hooks/useTitle";

interface PublicProfileData {
  user: {
    username: string;
    created_at: string;
  };
  stats: {
    total_games: number;
    by_status: Record<string, number>;
    average_rating: number | null;
    rated_count: number;
    completion_ratio: number;
    top_genres: { name: string; count: number }[];
  };
  favorites: {
    game_id: number;
    game_name: string;
    game_cover_url: string | null;
  }[];
  monthly: {
    month: string;
    label: string;
    count: number;
  }[];
  recent_diary: {
    game_id: number;
    game_name: string;
    game_cover_url: string | null;
    played_at: string;
    status: string;
    rating: number | null;
    note: string | null;
  }[];
  lists: {
    id: number;
    name: string;
    description: string | null;
    item_count: number;
    preview_covers: string[];
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
};

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useTitle(data ? `${data.user.username}'s Profile` : "Profile");

  useEffect(() => {
    api
      .get(`/profile/${username}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const getCoverUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `https:${url}`;
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--cp-bg)] text-[var(--cp-text-dim)] p-8 flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading profile...</div>
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen bg-[var(--cp-bg)] text-[var(--cp-text-dim)] p-8 text-center">
        <p className="font-display text-xl mb-2">User not found</p>
        <button
          onClick={() => navigate("/")}
          className="text-[var(--cp-accent)] hover:brightness-110 transition"
        >
          ← Back to home
        </button>
      </div>
    );

  if (!data) return null;

  const { user, stats, favorites, monthly, recent_diary, lists } = data;
  const completionDash = 163.36 - (163.36 * stats.completion_ratio) / 100;
  const maxMonthly = Math.max(...monthly.map((m) => m.count), 1);

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-[var(--cp-surf-2)] flex items-center justify-center text-2xl font-medium text-[var(--cp-accent)]">
            {user.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl text-[var(--cp-text)]">{user.username}</h1>
          </div>
        </div>

        {/* Stats line */}
        <p className="font-mono text-[var(--cp-text-dim)] text-[11px] mb-8 tracking-wide">
          {stats.total_games} games · {stats.by_status["Completed"] || 0} completed · avg ★ {stats.average_rating || "—"} · joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </p>

        {/* Favorites */}
        {favorites.length > 0 && (
          <>
            <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">FAVORITE GAMES</p>
            <div className="grid grid-cols-4 gap-3 mb-8">
              {favorites.map((fav) => (
                <div key={fav.game_id}>
                  <div
                    onClick={() => navigate(`/game/${fav.game_id}`)}
                    className="cursor-pointer group"
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
                  <p className="text-[11px] text-[var(--cp-text-dim)] mt-1.5 truncate">
                    {fav.game_name}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {stats.total_games > 0 && (
          <>
            {/* Completion + Status */}
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
                    <p className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider">Completion rate</p>
                    <p className="text-[var(--cp-text-dim)] text-sm mt-1">
                      {stats.by_status["Completed"] || 0} of {stats.total_games} games completed
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--cp-surf)] rounded-lg p-5 border border-[var(--cp-border)]">
                <p className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider mb-3">STATUS</p>
                {Object.entries(stats.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[status] || "#6b7280" }} />
                    <span className="text-[12px] text-[var(--cp-text-dim)] w-24">{status}</span>
                    <div className="flex-1 h-1.5 bg-[var(--cp-bg)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / stats.total_games) * 100}%`, backgroundColor: STATUS_COLORS[status] || "#6b7280" }} />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--cp-text-dimmer)] w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat cards */}
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
                          <div className="h-full rounded-full bg-[var(--cp-accent-2)]" style={{ width: `${(genre.count / maxCount) * 100}%` }} />
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

        {/* Recent Diary */}
        {recent_diary.length > 0 && (
          <>
            <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">RECENT DIARY</p>
            <div className="space-y-0 mb-8">
              {recent_diary.map((entry, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/game/${entry.game_id}`)}
                  className="grid items-center gap-3 py-2.5 border-b border-dashed border-[var(--cp-border)]/50 cursor-pointer hover:bg-[var(--cp-surf)]/50 transition"
                  style={{ gridTemplateColumns: "auto 1fr auto" }}
                >
                  {getCoverUrl(entry.game_cover_url) ? (
                    <img src={getCoverUrl(entry.game_cover_url)!} alt={entry.game_name} className="w-8 aspect-[3/4] object-cover rounded-sm" />
                  ) : (
                    <div className="w-8 aspect-[3/4] bg-[var(--cp-surf-2)] rounded-sm" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--cp-text)] truncate">{entry.game_name}</p>
                    <p className="text-[11px] text-[var(--cp-text-dim)]">
                      <span className="inline-flex items-center gap-1">
                        <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[entry.status] || "#6b7280" }} />
                        {entry.status}
                      </span>
                      {entry.note && ` · "${entry.note}"`}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--cp-star)]">
                    {entry.rating ? `★ ${entry.rating}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lists */}
        {lists.length > 0 && (
          <>
            <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">LISTS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {lists.map((list) => (
                <div key={list.id} className="bg-[var(--cp-surf)] rounded-lg p-4 border border-[var(--cp-border)]">
                  <p className="text-sm font-medium text-[var(--cp-text)]">{list.name}</p>
                  <p className="font-mono text-[11px] text-[var(--cp-text-dimmer)] mt-1">
                    {list.item_count} game{list.item_count !== 1 ? "s" : ""}
                  </p>
                  {list.preview_covers.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {list.preview_covers.slice(0, 4).map((cover, i) => (
                        <img key={i} src={cover.startsWith("http") ? cover : `https:${cover}`} alt="" className="w-10 h-14 object-cover rounded-sm" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {stats.total_games === 0 && (
          <p className="text-[var(--cp-text-dimmer)] text-center font-display text-xl italic">
            This user hasn't added any games yet.
          </p>
        )}
      </div>
    </div>
  );
}
