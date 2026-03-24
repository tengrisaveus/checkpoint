import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import api from "../api"
import { useAuth } from "../AuthContext"
import useTitle from "../hooks/useTitle"

interface StatsData {
  total_games: number
  by_status: Record<string, number>
  average_rating: number | null
  rated_count: number
  reviewed_count: number
}

const STATUS_COLORS: Record<string, string> = {
  "Playing": "#3b82f6",
  "Completed": "#22c55e",
  "Want to Play": "#eab308",
  "Dropped": "#ef4444",
}

export default function Stats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/library/stats")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  useTitle("Stats")

  if (loading) return <div className="min-h-screen bg-gray-900 text-gray-400 p-8">Loading...</div>
  if (!stats) return null

  const pieData = Object.entries(stats.by_status).map(([name, value]) => ({ name, value }))
  const barData = Object.entries(stats.by_status).map(([name, value]) => ({ name, count: value }))

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{user?.username}'s Profile</h1>
        <p className="text-gray-400 mb-8">{stats.total_games} games in library</p>

        {stats.total_games === 0 ? (
          <p className="text-gray-400 text-center">No games in library yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">{stats.total_games}</p>
                <p className="text-gray-400 text-sm">Total Games</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{stats.by_status["Completed"] || 0}</p>
                <p className="text-gray-400 text-sm">Completed</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{stats.average_rating || "—"}</p>
                <p className="text-gray-400 text-sm">Avg Rating</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.rated_count}</p>
                <p className="text-gray-400 text-sm">Rated</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Status Distribution</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Games by Status</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#9ca3af" }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}