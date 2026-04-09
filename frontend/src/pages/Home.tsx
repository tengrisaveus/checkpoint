import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import useTitle from "../hooks/useTitle";
import { useEffect } from "react";

export default function Home() {
  useTitle("Checkpoint — Track Your Games");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleDemo = async () => {
    try {
      await login("demo@checkpoint.app", "demo123456");
      navigate("/profile");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!loading && user) navigate("/search");
  }, [user, loading, navigate]);

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-[#0d0015]">
      {/* Hero */}
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
          Keep a record of every game you play. Rate, review, and see your stats
          — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
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
            className="px-8 py-3 rounded bg-[#1a0a2e] text-fuchsia-400 font-semibold hover:text-fuchsia-300 transition text-lg border border-fuchsia-500/50"
          >
            Try Demo
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e] text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-white font-semibold text-lg mb-2">Search</h3>
            <p className="text-[#a78bba] text-sm">
              Browse thousands of games from the IGDB database
            </p>
          </div>
          <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e] text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-white font-semibold text-lg mb-2">Track</h3>
            <p className="text-[#a78bba] text-sm">
              Mark games as Playing, Completed, Want to Play, or Dropped
            </p>
          </div>
          <div className="bg-[#1a0a2e] rounded-lg p-6 border border-[#2d1b4e] text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-white font-semibold text-lg mb-2">Stats</h3>
            <p className="text-[#a78bba] text-sm">
              See your gaming statistics with charts and insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
