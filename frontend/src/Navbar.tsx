import { Link } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
  <Link to="/" className="text-xl font-bold text-red-500">
    Checkpoint
  </Link>
  <Link to="/search" className="text-slate-400 hover:text-white transition">
    Search
  </Link>
  {user && (
    <>
      <Link to="/library" className="text-slate-400 hover:text-white transition">
        My Library
      </Link>
      <Link to="/stats" className="text-slate-400 hover:text-white transition">
        Stats
      </Link>
    </>
  )}
</div>
        

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-slate-400">{user.username}</span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-slate-400 hover:text-white transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}