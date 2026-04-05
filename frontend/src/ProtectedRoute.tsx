import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-[#0d0015] text-[#a78bba] p-8">Loading...</div>
  if (!user) return <Navigate to="/login" />

  return <>{children}</>
}