import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-[#1a0a2e] border-b border-[#2d1b4e]">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center shrink-0">
          <img src="/checkpoint-logo-navbar.png" alt="Checkpoint" className="h-8" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/search" className="text-[#a78bba] hover:text-white transition">Search</Link>
          {user && (
            <>
              <Link to="/library" className="text-[#a78bba] hover:text-white transition">Library</Link>
              <Link to="/profile" className="text-[#a78bba] hover:text-white transition">Profile</Link>
              <Link to="/diary" className="text-[#a78bba] hover:text-white transition">Diary</Link>
              <Link to="/lists" className="text-[#a78bba] hover:text-white transition">Lists</Link>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <span className="text-[#a78bba]">{user.username}</span>
              <button onClick={logout} className="text-[#a78bba] hover:text-white transition">Logout</button>
            </>
          ) : (
            <Link to="/login" className="text-[#a78bba] hover:text-white transition">Login</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[#a78bba] hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#2d1b4e] px-4 py-4 space-y-3">
          <Link to="/search" onClick={() => setMenuOpen(false)} className="block text-[#a78bba] hover:text-white transition">Search</Link>
          {user && (
            <>
              <Link to="/library" onClick={() => setMenuOpen(false)} className="block text-[#a78bba] hover:text-white transition">Library</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-[#a78bba] hover:text-white transition">Profile</Link>
              <Link to="/diary" onClick={() => setMenuOpen(false)} className="block text-[#a78bba] hover:text-white transition">Diary</Link>
              <Link to="/lists" onClick={() => setMenuOpen(false)} className="block text-[#a78bba] hover:text-white transition">Lists</Link>
            </>
          )}
          <div className="border-t border-[#2d1b4e] pt-3">
            {user ? (
              <button onClick={() => { logout(); setMenuOpen(false) }} className="text-[#a78bba] hover:text-white transition">
                Logout ({user.username})
              </button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-[#a78bba] hover:text-white transition">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}