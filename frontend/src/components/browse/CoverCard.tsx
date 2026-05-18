import { useNavigate } from "react-router-dom"
import type { Game } from "../../types"
import { fallbackGradient, getYear } from "../../utils"

type Variant = "default" | "ranked" | "upcoming" | "new"

function coverUrl(game: Game): string | null {
  if (!game.cover?.url) return null
  return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
}

function formatShortDate(timestamp?: number): string {
  if (!timestamp) return ""
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export default function CoverCard({
  game,
  variant = "default",
  rank,
}: {
  game: Game
  variant?: Variant
  rank?: number
}) {
  const navigate = useNavigate()
  const cover = coverUrl(game)
  const year = getYear(game.first_release_date)
  const firstGenre = game.genres?.[0]?.name
  const rating = game.aggregated_rating ?? game.rating
  const meta = [year, firstGenre].filter(Boolean).join(" · ")

  return (
    <div
      onClick={() => navigate(`/game/${game.id}`)}
      className="group cursor-pointer"
    >
      <div className="relative w-full aspect-[3/4] rounded overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={game.name}
            className="w-full h-full object-cover cover-hover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-2 text-center cover-placeholder text-[var(--cp-text-dim)] text-xs"
            style={{ background: fallbackGradient(game.id) }}
          >
            {game.name}
          </div>
        )}

        {variant === "default" && rating != null && (
          <div
            className="absolute top-1.5 right-1.5 px-1.5 py-[2px] rounded-[3px] backdrop-blur-md font-mono text-[12px] font-semibold"
            style={{
              backgroundColor: "rgba(10,6,16,0.8)",
              color: "#fbbf24",
            }}
          >
            {Math.round(rating)}
          </div>
        )}

        {variant === "ranked" && rank != null && (
          <div
            className="absolute top-1 left-2 font-display text-[var(--cp-text)] leading-none select-none"
            style={{
              fontWeight: 500,
              fontSize: "64px",
              textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            }}
          >
            {rank}
          </div>
        )}

        {variant === "upcoming" && game.first_release_date && (
          <div
            className="absolute top-1.5 right-1.5 px-1.5 py-[3px] rounded-[3px] backdrop-blur-md uppercase tracking-[.04em] text-[10.5px] font-semibold text-[var(--cp-text)]"
            style={{ backgroundColor: "rgba(10,6,16,0.7)" }}
          >
            {formatShortDate(game.first_release_date)}
          </div>
        )}

        {variant === "new" && game.first_release_date && (
          <div
            className="absolute top-1.5 right-1.5 px-1.5 py-[3px] rounded-[3px] backdrop-blur-md uppercase tracking-[.04em] text-[10.5px] font-semibold text-white"
            style={{ backgroundColor: "var(--cp-accent)" }}
          >
            NEW · {formatShortDate(game.first_release_date)}
          </div>
        )}
      </div>

      <div className="mt-1.5 text-[14px] font-medium leading-tight text-[var(--cp-text)] group-hover:text-[var(--cp-accent)] transition truncate">
        {game.name}
      </div>
      {meta && (
        <div className="mt-0.5 text-[12px] text-[var(--cp-text-dim)] truncate">
          {meta}
        </div>
      )}
    </div>
  )
}

