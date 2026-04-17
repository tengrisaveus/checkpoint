import { useNavigate } from "react-router-dom"
import useTitle from "../hooks/useTitle"

export default function NotFound() {
  useTitle("404")
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] flex flex-col items-center justify-center p-8">
      <p className="font-mono text-[var(--cp-text-dimmer)] text-xs uppercase tracking-[0.2em] mb-4">ERROR 404</p>
      <p className="font-display text-6xl md:text-8xl text-[var(--cp-text)] mb-4">
        Not <em className="italic text-[var(--cp-accent)]">found</em>.
      </p>
      <p className="text-[var(--cp-text-dim)] mb-8 text-center max-w-sm">
        This page doesn't exist — or it slipped into the ether between checkpoints.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition"
      >
        Go Home
      </button>
    </div>
  )
}
