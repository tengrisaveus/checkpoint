import { useState } from "react"
import { useAuth } from "../AuthContext"
import { useNavigate, Link } from "react-router-dom"
import useTitle from "../hooks/useTitle"

export default function Register() {
  useTitle("Register")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await register(username, email, password)
      navigate("/")
    } catch {
      setError("Registration failed. Email or username may be taken.")
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] flex items-center justify-center">
      <div className="bg-[var(--cp-surf)] p-8 rounded-lg w-full max-w-md border border-[var(--cp-border)]">
        <h1 className="font-display text-2xl text-[var(--cp-text)] mb-6 text-center">Register</h1>

        {error && (
          <p className="bg-[var(--cp-accent)]/20 text-[var(--cp-accent)] p-3 rounded-sm mb-4 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider block mb-1.5">USERNAME</label>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
            />
          </div>
          <div>
            <label className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider block mb-1.5">EMAIL</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
            />
          </div>
          <div>
            <label className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-wider block mb-1.5">PASSWORD</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)]"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 rounded-sm bg-[var(--cp-accent)] text-white font-semibold hover:brightness-110 transition"
          >
            Register
          </button>
        </form>

        <p className="text-[var(--cp-text-dim)] text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-[var(--cp-accent)] hover:brightness-110 transition">Login</Link>
        </p>
      </div>
    </div>
  )
}
