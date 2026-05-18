import { useNavigate } from "react-router-dom"
import type { Game } from "../../../types"
import { fallbackGradient, getYear } from "../../../utils"

function coverUrl(game: Game): string | null {
  if (!game.cover?.url) return null
  return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
}

export default function TopRatedHero({ games }: { games: Game[] }) {
  const navigate = useNavigate()
  const top = games.slice(0, 3)
  if (!top.length) return null

  return (
    <div className="mb-10">
      <div className="text-[12px] uppercase tracking-[.04em] font-semibold text-[var(--cp-text-dim)] mb-3">
        Critically acclaimed
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top.map((game, i) => {
          const cover = coverUrl(game)
          const rating = game.aggregated_rating ?? game.rating
          return (
            <div
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              className="relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer group"
            >
              {cover ? (
                <img
                  src={cover}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: fallbackGradient(game.id) }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,6,16,0.05) 40%, rgba(10,6,16,0.9) 100%)",
                }}
              />
              <div
                className="absolute top-3 left-4 font-display text-white leading-none select-none"
                style={{
                  fontWeight: 500,
                  fontSize: "120px",
                  textShadow: "0 4px 24px rgba(0,0,0,0.7)",
                }}
              >
                {i + 1}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3
                  className="font-display text-[var(--cp-text)] text-2xl leading-tight"
                  style={{ fontWeight: 500 }}
                >
                  {game.name}
                </h3>
                <div className="mt-1.5 flex items-center gap-3 text-[12.5px] text-[var(--cp-text-dim)]">
                  {rating != null && (
                    <span className="font-mono text-[var(--cp-star)]">
                      ★ {Math.round(rating)}
                    </span>
                  )}
                  {getYear(game.first_release_date) && (
                    <span>{getYear(game.first_release_date)}</span>
                  )}
                  {game.genres?.[0]?.name && <span>{game.genres[0].name}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
