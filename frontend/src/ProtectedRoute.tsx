import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 p-8">Loading...</div>
  if (!user) return <Navigate to="/login" />

  return <>{children}</>
}