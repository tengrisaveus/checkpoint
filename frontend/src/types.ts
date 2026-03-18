export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface Game {
  id: number
  name: string
  cover?: { url: string }
  genres?: { name: string }[]
  platforms?: { name: string }[]
  involved_companies?: { company: { name: string } }[]
  first_release_date?: number
  summary?: string
  storyline?: string
  rating?: number
  aggregated_rating?: number
}

export interface LibraryEntry {
  id: number
  game_id: number
  status: string
  rating: number | null
  review: string | null
  created_at: string
  updated_at: string
}

export const GAME_STATUSES = ["Playing", "Completed", "Want to Play", "Dropped"] as const
export type GameStatus = typeof GAME_STATUSES[number]