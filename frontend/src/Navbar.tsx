import { Link } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-white">
            Checkpoint 🎮
          </Link>
          {user && (
            <>
              <Link to="/library" className="text-gray-300 hover:text-white transition">
                My Library
              </Link>
              <Link to="/stats" className="text-gray-300 hover:text-white transition">
                Stats
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-400">{user.username}</span>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-gray-300 hover:text-white transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}