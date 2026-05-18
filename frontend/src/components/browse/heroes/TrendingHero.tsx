import { useNavigate } from "react-router-dom"
import type { Game } from "../../../types"
import { fallbackGradient, getYear } from "../../../utils"

function coverUrl(game: Game): string | null {
  if (!game.cover?.url) return null
  return `https:${game.cover.url.replace("t_thumb", "t_1080p")}`
}

function smallCoverUrl(game: Game): string | null {
  if (!game.cover?.url) return null
  return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
}

export default function TrendingHero({ games }: { games: Game[] }) {
  const navigate = useNavigate()
  if (!games.length) return null

  const [hero, ...rest] = games
  const others = rest.slice(0, 3)
  const heroCover = coverUrl(hero)
  const heroRating = hero.aggregated_rating ?? hero.rating

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4 mb-10">
      <div
        onClick={() => navigate(`/game/${hero.id}`)}
        className="relative aspect-[16/9] md:aspect-[16/10] rounded-lg overflow-hidden cursor-pointer group"
      >
        {heroCover ? (
          <img
            src={heroCover}
            alt={hero.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: fallbackGradient(hero.id) }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,6,16,0.05) 35%, rgba(10,6,16,0.85) 100%)",
          }}
        />
        <div className="absolute top-4 left-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm uppercase tracking-[.04em] text-[11px] font-semibold text-white"
            style={{ backgroundColor: "var(--cp-accent)" }}
          >
            ↑ #1 TRENDING
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2
            className="font-display text-[var(--cp-text)] text-3xl md:text-4xl leading-tight"
            style={{ fontWeight: 500 }}
          >
            {hero.name}
          </h2>
          {hero.summary && (
            <p className="mt-2 text-[14px] text-[var(--cp-text-dim)] max-w-[60ch] line-clamp-2">
              {hero.summary}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-[13px] text-[var(--cp-text-dim)]">
            {heroRating != null && (
              <span className="font-mono text-[var(--cp-star)]">
                ★ {Math.round(heroRating)}
              </span>
            )}
            {getYear(hero.first_release_date) && (
              <span>{getYear(hero.first_release_date)}</span>
            )}
            {hero.genres?.[0]?.name && <span>{hero.genres[0].name}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-[12px] uppercase tracking-[.04em] font-semibold text-[var(--cp-text-dim)] mb-2">
          Also rising
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {others.map((game, idx) => {
            const sc = smallCoverUrl(game)
            return (
              <div
                key={game.id}
                onClick={() => navigate(`/game/${game.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-md border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/40 transition cursor-pointer"
              >
                <span
                  className="font-display text-[var(--cp-text-dim)] leading-none w-7 text-center"
                  style={{ fontWeight: 500, fontSize: "28px" }}
                >
                  {idx + 2}
                </span>
                <div className="w-10 aspect-[3/4] rounded overflow-hidden shrink-0">
                  {sc ? (
                    <img
                      src={sc}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ background: fallbackGradient(game.id) }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-[var(--cp-text)] truncate">
                    {game.name}
                  </div>
                  <div className="text-[12px] text-[var(--cp-text-dim)] truncate">
                    {[getYear(game.first_release_date), game.genres?.[0]?.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
