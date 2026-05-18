import { useNavigate } from "react-router-dom"
import type { Game } from "../../../types"
import { fallbackGradient } from "../../../utils"

function smallCoverUrl(game: Game): string | null {
  if (!game.cover?.url) return null
  return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
}

function bucketKey(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
}

function bucketLabel(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export default function UpcomingHero({ games }: { games: Game[] }) {
  const navigate = useNavigate()
  const buckets: { key: string; label: string; games: Game[] }[] = []
  const byKey: Record<string, { label: string; games: Game[] }> = {}
  for (const g of games) {
    if (!g.first_release_date) continue
    const k = bucketKey(g.first_release_date)
    if (!byKey[k]) {
      byKey[k] = { label: bucketLabel(g.first_release_date), games: [] }
      buckets.push({ key: k, label: byKey[k].label, games: byKey[k].games })
    }
    byKey[k].games.push(g)
  }
  if (!buckets.length) return null

  return (
    <div className="mb-10">
      <div className="text-[12px] uppercase tracking-[.04em] font-semibold text-[var(--cp-text-dim)] mb-3">
        On the horizon
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {buckets.slice(0, 6).map((b) => {
          const top = b.games[0]
          const cover = smallCoverUrl(top)
          return (
            <div
              key={b.key}
              onClick={() => navigate(`/game/${top.id}`)}
              className="relative aspect-[3/4] rounded-md overflow-hidden cursor-pointer group border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/40 transition"
            >
              {cover ? (
                <img
                  src={cover}
                  alt={top.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: fallbackGradient(top.id) }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,6,16,0.0) 40%, rgba(10,6,16,0.92) 100%)",
                }}
              />
              <div className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-[3px] backdrop-blur-md uppercase tracking-[.04em] text-[10.5px] font-semibold text-[var(--cp-text)]"
                style={{ backgroundColor: "rgba(10,6,16,0.7)" }}
              >
                {b.label}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="text-[13px] font-medium text-[var(--cp-text)] truncate">
                  {top.name}
                </div>
                {b.games.length > 1 && (
                  <div className="text-[11px] text-[var(--cp-text-dim)] mt-0.5">
                    +{b.games.length - 1} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
