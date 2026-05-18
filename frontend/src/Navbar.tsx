import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { useCommandPalette } from "./CommandPaletteContext"

export default function Navbar() {
  const { user, logout } = useAuth()
  const { open: openPalette } = useCommandPalette()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const browseActive = location.pathname.startsWith("/browse")

  return (
    <nav className="bg-[var(--cp-surf)] border-b border-[var(--cp-border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center shrink-0">
          <img src="/checkpoint-logo-navbar.png" alt="Checkpoint" className="h-8" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/browse"
            className={`transition text-sm ${
              browseActive
                ? "text-[var(--cp-text)] border-b border-[var(--cp-accent)] pb-0.5"
                : "text-[var(--cp-text-dim)] hover:text-[var(--cp-text)]"
            }`}
          >
            Browse
          </Link>
          <button
            onClick={openPalette}
            className="flex items-center gap-2 text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm"
          >
            <span>⌕</span>
            <span>Search</span>
          </button>
          {user && (
            <>
              <Link to="/library" className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Library</Link>
              <Link to="/profile" className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Profile</Link>
              <Link to="/diary" className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Diary</Link>
              <Link to="/lists" className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Lists</Link>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <span className="text-[var(--cp-text-dim)] text-sm">{user.username}</span>
              <button onClick={logout} className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Logout</button>
            </>
          ) : (
            <Link to="/login" className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Login</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[var(--cp-text-dim)] hover:text-[var(--cp-text)]"
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
        <div className="md:hidden border-t border-[var(--cp-border)] px-6 py-4 space-y-3">
          <Link
            to="/browse"
            onClick={() => setMenuOpen(false)}
            className={`block transition text-sm ${
              browseActive
                ? "text-[var(--cp-text)]"
                : "text-[var(--cp-text-dim)] hover:text-[var(--cp-text)]"
            }`}
          >
            Browse
          </Link>
          <button
            onClick={() => { setMenuOpen(false); openPalette() }}
            className="block text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm"
          >
            ⌕ Search
          </button>
          {user && (
            <>
              <Link to="/library" onClick={() => setMenuOpen(false)} className="block text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Library</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Profile</Link>
              <Link to="/diary" onClick={() => setMenuOpen(false)} className="block text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Diary</Link>
              <Link to="/lists" onClick={() => setMenuOpen(false)} className="block text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Lists</Link>
            </>
          )}
          <div className="border-t border-[var(--cp-border)] pt-3">
            {user ? (
              <button onClick={() => { logout(); setMenuOpen(false) }} className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">
                Logout ({user.username})
              </button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] transition text-sm">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
