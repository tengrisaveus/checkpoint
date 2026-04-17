import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import useTitle from "../hooks/useTitle";
import { useEffect, useState } from "react";
import api from "../api";
import type { DiaryEntry, Game } from "../types";

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
};

interface LibraryEntryWithGame {
  game_id: number;
  game_name: string;
  game_cover_url: string | null;
  status: string;
  rating: number | null;
}

interface StatsData {
  total_games: number;
  by_status: Record<string, number>;
  average_rating: number | null;
  completion_ratio: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getWeekDay(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function getDateLabel(): string {
  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = now.getDate();
  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${month} ${day} · WK ${weekNum}`;
}

export default function Home() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [recentGames, setRecentGames] = useState<LibraryEntryWithGame[]>([]);
  const [recentDiary, setRecentDiary] = useState<DiaryEntry[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [communityTab, setCommunityTab] = useState<"popular" | "upcoming">("popular");

  useTitle(user ? "Home" : "Checkpoint — Track Your Games");

  useEffect(() => {
    if (!user) return;
    api.get("/library").then((res) => setRecentGames(res.data)).catch(() => {});
    api.get("/diary").then((res) => setRecentDiary(res.data.slice(0, 6))).catch(() => {});
    api.get("/library/stats").then((res) => setStats(res.data)).catch(() => {});
  }, [user]);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await login("demo@checkpoint.app", "demo123456");
    } catch {
      setDemoLoading(false);
    }
  };

  const getCoverUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `https:${url}`;
  };

  const getGameCoverUrl = (game: Game) => {
    if (!game.cover?.url) return null;
    return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (!user) return;
    api.get("/games/popular").then((res) => setPopularGames(res.data)).catch(() => {});
    api.get("/games/upcoming").then((res) => setUpcomingGames(res.data)).catch(() => {});
  }, [user]);

  // Also fetch popular for landing
  useEffect(() => {
    if (user) return;
    api.get("/games/popular").then((res) => setPopularGames(res.data)).catch(() => {});
  }, [user]);

  if (loading) return null;

  // ====== LOGGED OUT — EDITORIAL LANDING ======
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--cp-bg)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-12 items-start">
            <div>
              <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--cp-text-dimmer)]">
                YOUR GAMING JOURNAL
              </p>
              <h1 className="font-display text-5xl md:text-7xl text-[var(--cp-text)] leading-[0.95] mt-3 tracking-tight">
                Your games, <em className="text-[var(--cp-accent)] italic">remembered</em>.
              </h1>
              <p className="text-[var(--cp-text-dim)] text-base md:text-lg leading-relaxed mt-5 max-w-[52ch]">
                A log, a rating, a review, a list. Checkpoint is where you keep
                track of what you've played, what you're playing, and what's next.
              </p>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => navigate("/register")}
                  className="px-6 py-3 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition text-sm"
                >
                  Start tracking
                </button>
                <button
                  onClick={handleDemo}
                  disabled={demoLoading}
                  className="px-6 py-3 rounded-sm text-[var(--cp-text)] text-sm border border-[var(--cp-border)] hover:border-[var(--cp-accent)] transition"
                >
                  {demoLoading ? "Logging in..." : "Peek as demo →"}
                </button>
              </div>
            </div>

            {/* Right — game covers */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--cp-text-dimmer)] mb-3">
                WHAT'S BEING PLAYED NOW
              </p>
              <div className="grid grid-cols-2 gap-2">
                {popularGames.slice(0, 4).map((game) => {
                  const cover = getGameCoverUrl(game);
                  return (
                    <div
                      key={game.id}
                      onClick={() => navigate(`/game/${game.id}`)}
                      className="cursor-pointer group"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={game.name}
                          className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-[var(--cp-surf)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-sm cover-placeholder p-2 text-center">
                          {game.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Browse button for non-logged-in */}
          <div className="mt-12 border-t border-[var(--cp-border)] pt-8">
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--cp-text-dimmer)] mb-4">
              BROWSE THE CATALOG
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {popularGames.slice(4, 10).map((game) => {
                const cover = getGameCoverUrl(game);
                return (
                  <div
                    key={game.id}
                    onClick={() => navigate(`/game/${game.id}`)}
                    className="cursor-pointer group"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={game.name}
                        className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[var(--cp-surf)] rounded-md" />
                    )}
                    <p className="text-[11px] text-[var(--cp-text-dim)] mt-1.5 truncate">
                      {game.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== LOGGED IN — DASHBOARD ======
  const playingGames = recentGames.filter((g) => g.status === "Playing");
  const queueGames = recentGames.filter((g) => g.status === "Want to Play");
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekDiary = recentDiary.filter(
    (e) => new Date(e.played_at) >= weekAgo,
  );

  const communityGames = communityTab === "popular" ? popularGames : upcomingGames;

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-[var(--cp-text)] leading-none">
              {getGreeting()}, <em className="italic">{user.username}</em>.
            </h1>
            <p className="text-[var(--cp-text-dim)] text-sm mt-2">
              {stats ? `${stats.by_status["Playing"] || 0} playing · ${stats.by_status["Completed"] || 0} completed · ${recentDiary.length} diary entries` : "Loading stats..."}
            </p>
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] hidden md:block">
            {getDateLabel()}
          </span>
        </div>

        {/* Continue Playing */}
        {playingGames.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] mb-3">
              ▸ CONTINUE PLAYING · {playingGames.length} ACTIVE
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {playingGames.slice(0, 3).map((game) => (
                <div
                  key={game.game_id}
                  onClick={() => navigate(`/game/${game.game_id}`)}
                  className="flex gap-3 bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg p-3 cursor-pointer hover:border-[var(--cp-accent)]/30 transition"
                >
                  {getCoverUrl(game.game_cover_url) ? (
                    <img
                      src={getCoverUrl(game.game_cover_url)!}
                      alt={game.game_name}
                      className="w-14 aspect-[3/4] object-cover rounded-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 aspect-[3/4] bg-[var(--cp-surf-2)] rounded-md shrink-0 flex items-center justify-center text-[var(--cp-text-dimmer)] text-[9px] cover-placeholder text-center p-1">
                      {game.game_name}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[var(--cp-text)] text-sm font-medium truncate">
                      {game.game_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="status-dot" style={{ backgroundColor: STATUS_COLORS["Playing"] }} />
                      <span className="font-mono text-[10px] text-[var(--cp-text-dimmer)] tracking-wide">
                        PLAYING
                      </span>
                    </div>
                    {game.rating && (
                      <p className="font-mono text-[10px] text-[var(--cp-star)] mt-1.5">
                        {"★".repeat(Math.floor(game.rating / 2))}{game.rating % 2 ? "½" : ""} · {game.rating}/10
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two columns: This Week Diary + Your Queue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* This Week Diary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)]">
                ▸ DIARY · THIS WEEK
              </p>
              <button
                onClick={() => navigate("/diary")}
                className="text-[var(--cp-accent)] hover:brightness-110 text-[11px] transition"
              >
                View all →
              </button>
            </div>
            {thisWeekDiary.length > 0 ? (
              <div className="space-y-0">
                {thisWeekDiary.slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => navigate(`/game/${entry.game_id}`)}
                    className="grid grid-cols-[44px_1fr_auto] gap-3 py-2.5 border-b border-dashed border-[var(--cp-border)] cursor-pointer items-center hover:bg-[var(--cp-surf)]/50 transition"
                  >
                    <span className="font-mono text-[11px] text-[var(--cp-text-dimmer)] text-right">
                      {formatDate(entry.played_at).toUpperCase().replace(",", "")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[var(--cp-text)] text-[13px] truncate">
                        {entry.game_name}
                      </p>
                      <p className="text-[var(--cp-text-dim)] text-[11px] truncate">
                        <span className="inline-flex items-center gap-1">
                          <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[entry.status] || "#6b7280" }} />
                          {entry.status}
                        </span>
                        {entry.note && ` · "${entry.note}"`}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--cp-star)]">
                      {entry.rating ? "★".repeat(Math.min(Math.floor(entry.rating / 2), 5)) + (entry.rating % 2 ? "½" : "") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--cp-text-dimmer)] text-sm">No entries this week.</p>
            )}
          </div>

          {/* Your Queue */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)]">
                ▸ YOUR QUEUE · {queueGames.length} GAMES
              </p>
              <button
                onClick={() => navigate("/library")}
                className="text-[var(--cp-accent)] hover:brightness-110 text-[11px] transition"
              >
                View all →
              </button>
            </div>
            {queueGames.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {queueGames.slice(0, 4).map((game) => (
                    <div
                      key={game.game_id}
                      onClick={() => navigate(`/game/${game.game_id}`)}
                      className="cursor-pointer group"
                    >
                      {getCoverUrl(game.game_cover_url) ? (
                        <img
                          src={getCoverUrl(game.game_cover_url)!}
                          alt={game.game_name}
                          className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-[var(--cp-surf-2)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-[9px] cover-placeholder p-1 text-center">
                          {game.game_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {queueGames.length > 1 && (
                  <div className="flex items-center justify-between mt-3 px-3 py-2.5 bg-[var(--cp-surf)] border border-dashed border-[var(--cp-border)] rounded-lg">
                    <span className="text-[var(--cp-text-dim)] text-[12px]">Can't decide?</span>
                    <button
                      onClick={() => {
                        const random = queueGames[Math.floor(Math.random() * queueGames.length)];
                        navigate(`/game/${random.game_id}`);
                      }}
                      className="font-mono text-[10px] text-[var(--cp-accent)] tracking-wide hover:brightness-110 transition"
                    >
                      PICK ONE FOR ME →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[var(--cp-text-dimmer)] text-sm">
                No games in your queue.{" "}
                <span onClick={() => navigate("/search")} className="text-[var(--cp-accent)] cursor-pointer hover:brightness-110 transition">
                  Search for games
                </span>
              </p>
            )}
          </div>
        </div>

        {/* From the Community */}
        {(popularGames.length > 0 || upcomingGames.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)]">
                ▸ FROM THE COMMUNITY
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCommunityTab("popular")}
                  className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-sm transition ${communityTab === "popular" ? "bg-[var(--cp-accent)]/15 text-[var(--cp-accent)]" : "text-[var(--cp-text-dimmer)] hover:text-[var(--cp-text-dim)]"}`}
                >
                  HOT
                </button>
                <button
                  onClick={() => setCommunityTab("upcoming")}
                  className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-sm transition ${communityTab === "upcoming" ? "bg-[var(--cp-accent)]/15 text-[var(--cp-accent)]" : "text-[var(--cp-text-dimmer)] hover:text-[var(--cp-text-dim)]"}`}
                >
                  UPCOMING
                </button>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
              {communityGames.slice(0, 10).map((game) => {
                const cover = getGameCoverUrl(game);
                return (
                  <div
                    key={game.id}
                    onClick={() => navigate(`/game/${game.id}`)}
                    className="cursor-pointer group shrink-0 w-[132px]"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={game.name}
                        className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[var(--cp-surf)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-xs cover-placeholder p-2 text-center">
                        {game.name}
                      </div>
                    )}
                    <p className="text-[11px] text-[var(--cp-text-dim)] mt-1.5 truncate">
                      {game.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Library overview (if no playing games, show recent library) */}
        {playingGames.length === 0 && recentGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)]">
                ▸ YOUR LIBRARY
              </p>
              <button
                onClick={() => navigate("/library")}
                className="text-[var(--cp-accent)] hover:brightness-110 text-[11px] transition"
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {recentGames.slice(0, 8).map((game) => (
                <div
                  key={game.game_id}
                  onClick={() => navigate(`/game/${game.game_id}`)}
                  className="cursor-pointer group"
                >
                  {getCoverUrl(game.game_cover_url) ? (
                    <img
                      src={getCoverUrl(game.game_cover_url)!}
                      alt={game.game_name}
                      className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-[var(--cp-surf-2)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-[9px] cover-placeholder p-1 text-center">
                      {game.game_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
