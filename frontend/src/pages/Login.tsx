import { useState } from "react"
import { useAuth } from "../AuthContext"
import { useNavigate, Link } from "react-router-dom"
import useTitle from "../hooks/useTitle"

export default function Login() {
  useTitle("Login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await login(email, password)
      navigate("/")
    } catch {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 p-8 rounded-lg w-full max-w-md border border-slate-800">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Login</h1>

        {error && (
          <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 border border-slate-700"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 border border-slate-700"
          />
          <button
            type="submit"
            className="w-full p-3 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            Login
          </button>
        </form>

        <p className="text-slate-400 text-center mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-red-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}