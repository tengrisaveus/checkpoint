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
    <div className="min-h-screen bg-[#0d0015] flex items-center justify-center">
      <div className="bg-[#1a0a2e] p-8 rounded-lg w-full max-w-md border border-[#2d1b4e]">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Register</h1>

        {error && (
          <p className="bg-fuchsia-500/20 text-fuchsia-400 p-3 rounded mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-[#2d1b4e] text-white placeholder-[#8a6baa] outline-none focus:ring-2 focus:ring-fuchsia-500 border border-[#3d2b5e]"
          />
          <button
            type="submit"
            className="w-full p-3 rounded bg-fuchsia-500 text-white font-semibold hover:bg-fuchsia-600 transition"
          >
            Register
          </button>
        </form>

        <p className="text-[#a78bba] text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-fuchsia-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}