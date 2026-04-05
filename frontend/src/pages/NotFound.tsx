import { useNavigate } from "react-router-dom"
import useTitle from "../hooks/useTitle"

export default function NotFound() {
  useTitle("404")
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0d0015] flex flex-col items-center justify-center">
      <p className="text-6xl font-bold text-white mb-4">404</p>
      <p className="text-[#a78bba] mb-6">This page doesn't exist</p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition"
      >
        Go Home
      </button>
    </div>
  )
}