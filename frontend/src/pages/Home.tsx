import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import useTitle from "../hooks/useTitle";
import { useEffect, useState } from "react";
import api from "../api";
import type { DiaryEntry, Game } from "../types";
import { getCoverUrl } from "../utils";

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

export default function Home() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [recentGames, setRecentGames] = useState<LibraryEntryWithGame[]>([]);
  const [recentDiary, setRecentDiary] = useState<DiaryEntry[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);

  useTitle(user ? "Home" : "Checkpoint — Track Your Games");

  useEffect(() => {
    if (!user) return;
    api
      .get("/library")
      .then((res) => setRecentGames(res.data.slice(0, 8)))
      .catch(() => {});
    api
      .get("/diary")
      .then((res) => setRecentDiary(res.data.slice(0, 4)))
      .catch(() => {});
    api
      .get("/library/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (!user) return;
    api
      .get("/games/popular")
      .then((res) => setPopularGames(res.data))
      .catch(() => {});
    api
      .get("/games/upcoming")
      .then((res) => setUpcomingGames(res.data))
      .catch(() => {});
  }, [user]);

  if (loading) return null;

  // Logged out — landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d0015]">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
          <img
            src="/checkpoint-logo.png"
            alt="Checkpoint"
            className="h-16 mx-auto mb-8"
          />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Track Your <span className="text-fuchsia-500">Gaming</span> Journey
          </h1>
          <p className="text-[#a78bba] text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Keep a record of every game you play. Rate, review, and see your
            stats — all in one place.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition text-lg"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/search")}
              className="px-8 py-3 rounded bg-[#2d1b4e] text-[#c4a8d8] font-semibold hover:bg-[#3d2b5e] transition text-lg border border-[#3d2b5e]"
            >
              Browse Games
            </button>
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="px-8 py-3 rounded bg-[#1a0a2e] text-fuchsia-400 font-semibold hover:text-fuchsia-300 transition text-lg border border-fuchsia-500/50"
            >
              {demoLoading ? "Logging in..." : "Try Demo"}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a0a2e] rounded-xl p-6 border border-[#2d1b4e]/50 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-white font-medium text-base mb-2">Search</h3>
              <p className="text-[#8a6baa] text-sm">
                Browse thousands of games from the IGDB database
              </p>
            </div>
            <div className="bg-[#1a0a2e] rounded-xl p-6 border border-[#2d1b4e]/50 text-center">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-white font-medium text-base mb-2">Track</h3>
              <p className="text-[#8a6baa] text-sm">
                Mark games as Playing, Completed, Want to Play, or Dropped
              </p>
            </div>
            <div className="bg-[#1a0a2e] rounded-xl p-6 border border-[#2d1b4e]/50 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-white font-medium text-base mb-2">Stats</h3>
              <p className="text-[#8a6baa] text-sm">
                See your gaming statistics with charts and insights
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in — dashboard
  const completionDash = stats
    ? 163.36 - (163.36 * stats.completion_ratio) / 100
    : 163.36;

  return (
    <div className="min-h-screen bg-[#0d0015] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#2d1b4e] flex items-center justify-center text-2xl font-medium text-fuchsia-400">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-medium text-white">
              Welcome back, {user.username}
            </h1>
            <p className="text-[#8a6baa] text-sm">
              Here's your gaming activity
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && stats.total_games > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0">
                <svg viewBox="0 0 64 64" className="w-12 h-12 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#2d1b4e"
                    strokeWidth="5"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="5"
                    strokeDasharray="163.36"
                    strokeDashoffset={completionDash}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                  {stats.completion_ratio}%
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {stats.by_status["Completed"] || 0}/{stats.total_games}
                </p>
                <p className="text-[11px] text-[#8a6baa]">Completed</p>
              </div>
            </div>
            <div className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 text-center flex flex-col justify-center">
              <p className="text-2xl font-medium text-yellow-400">
                {stats.average_rating || "—"}
              </p>
              <p className="text-[11px] text-[#8a6baa]">Avg rating</p>
            </div>
            <div className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 text-center flex flex-col justify-center">
              <p className="text-2xl font-medium text-blue-400">
                {stats.by_status["Playing"] || 0}
              </p>
              <p className="text-[11px] text-[#8a6baa]">Playing</p>
            </div>
            <div className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 text-center flex flex-col justify-center">
              <p className="text-2xl font-medium text-fuchsia-400">
                {stats.total_games}
              </p>
              <p className="text-[11px] text-[#8a6baa]">Total games</p>
            </div>
          </div>
        )}

        {/* Recent Library */}
        {recentGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-medium text-white">
                Your library
              </h2>
              <button
                onClick={() => navigate("/library")}
                className="text-fuchsia-400 hover:text-fuchsia-300 text-[12px] transition"
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {recentGames.map((game) => (
                <div
                  key={game.game_id}
                  onClick={() => navigate(`/game/${game.game_id}`)}
                  className="cursor-pointer group"
                >
                  {getCoverUrl(game.game_cover_url) ? (
                    <img
                      src={getCoverUrl(game.game_cover_url)!}
                      alt={game.game_name}
                      className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 group-hover:ring-fuchsia-500 transition"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-lg flex items-center justify-center text-[#8a6baa] text-[10px] text-center p-1">
                      {game.game_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Diary */}
        {recentDiary.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-medium text-white">
                Recent diary
              </h2>
              <button
                onClick={() => navigate("/diary")}
                className="text-fuchsia-400 hover:text-fuchsia-300 text-[12px] transition"
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentDiary.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/game/${entry.game_id}`)}
                  className="bg-[#1a0a2e] rounded-xl p-3 flex items-center gap-3 border border-[#2d1b4e]/50 cursor-pointer hover:border-fuchsia-500/30 transition"
                >
                  {getCoverUrl(entry.game_cover_url) ? (
                    <img
                      src={getCoverUrl(entry.game_cover_url)!}
                      alt={entry.game_name}
                      className="w-10 h-14 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-[#2d1b4e] rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {entry.game_name}
                    </p>
                    <p className="text-[#8a6baa] text-[11px]">
                      {formatDate(entry.played_at)} · {entry.status}
                      {entry.rating && ` · ★ ${entry.rating}`}
                    </p>
                    {entry.note && (
                      <p className="text-[#8a6baa] text-[11px] truncate mt-0.5">
                        {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <h2 className="text-[15px] font-medium text-white mb-3">Quick links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => navigate("/search")}
            className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-white text-sm font-medium">Search</p>
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">👤</div>
            <p className="text-white text-sm font-medium">Profile</p>
          </button>
          <button
            onClick={() => navigate("/diary")}
            className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">📖</div>
            <p className="text-white text-sm font-medium">Diary</p>
          </button>
          <button
            onClick={() => navigate("/lists")}
            className="bg-[#1a0a2e] rounded-xl p-4 border border-[#2d1b4e]/50 text-center hover:border-fuchsia-500/30 transition"
          >
            <div className="text-2xl mb-2">📋</div>
            <p className="text-white text-sm font-medium">Lists</p>
          </button>
        </div>

        {/* Popular Games */}
        {popularGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-medium text-white">
                Popular games
              </h2>
              <button
                onClick={() => navigate("/search")}
                className="text-fuchsia-400 hover:text-fuchsia-300 text-[12px] transition"
              >
                Browse all →
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {popularGames.slice(0, 10).map((game) => {
                const cover = game.cover?.url
                  ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
                  : null;
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
                        className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 group-hover:ring-fuchsia-500 transition"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-lg" />
                    )}
                    <p className="text-[11px] text-[#c4a8d8] mt-1.5 truncate">
                      {game.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Games */}
        {upcomingGames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[15px] font-medium text-white mb-3">
              Coming soon
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {upcomingGames.slice(0, 10).map((game) => {
                const cover = game.cover?.url
                  ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
                  : null;
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
                        className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 group-hover:ring-fuchsia-500 transition"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#2d1b4e] rounded-lg" />
                    )}
                    <p className="text-[11px] text-[#c4a8d8] mt-1.5 truncate">
                      {game.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
