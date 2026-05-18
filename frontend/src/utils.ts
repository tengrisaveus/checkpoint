import type { Game } from "./types"

export function getCoverUrl(game?: Game | null): string | null {
  if (!game?.cover?.url) return null
  return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
}

export function getYear(timestamp?: number): string {
  if (!timestamp) return ""
  return new Date(timestamp * 1000).getFullYear().toString()
}

export function fallbackGradient(gameId: number): string {
  const palettes = [
    "linear-gradient(165deg,#5a1a3a,#1a0a2e)",
    "linear-gradient(160deg,#2a1a5a,#5a1a3a)",
    "linear-gradient(180deg,#4c1d95,#831843)",
    "linear-gradient(200deg,#1e3a8a,#4c1d95)",
    "linear-gradient(175deg,#6b21a8,#312e81)",
    "linear-gradient(195deg,#831843,#4c1d95)",
  ]
  return palettes[gameId % palettes.length]
}