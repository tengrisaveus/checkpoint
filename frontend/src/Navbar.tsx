import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-[#1a0a2e] border-b border-[#2d1b4e]">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <img
              src="/checkpoint-logo-navbar.png"
              alt="Checkpoint"
              className="h-8"
            />
          </Link>
          <Link
            to="/search"
            className="text-[#a78bba] hover:text-white transition"
          >
            Search
          </Link>
          {user && (
            <>
              <Link
                to="/library"
                className="text-[#a78bba] hover:text-white transition"
              >
                My Library
              </Link>
              <Link
                to="/profile"
                className="text-[#a78bba] hover:text-white transition"
              >
                Profile
              </Link>
              <Link
                to="/diary"
                className="text-[#a78bba] hover:text-white transition"
              >
                Diary
              </Link>
              <Link
                to="/lists"
                className="text-[#a78bba] hover:text-white transition"
              >
                Lists
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-[#a78bba]">{user.username}</span>
              <button
                onClick={logout}
                className="text-[#a78bba] hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-[#a78bba] hover:text-white transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
