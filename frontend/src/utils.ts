import type { Game } from "./types"

export function getCoverUrl(game?: Game | null): string | null {
  if (!game?.cover?.url) return null
  return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
}

export function getYear(timestamp?: number): string {
  if (!timestamp) return ""
  return new Date(timestamp * 1000).getFullYear().toString()
}