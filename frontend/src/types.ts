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
  platforms?: { name: string; abbreviation?: string }[]
  involved_companies?: { company: { name: string } }[]
  first_release_date?: number
  summary?: string
  storyline?: string
  rating?: number
  aggregated_rating?: number
  screenshots?: { url: string }[]
  artworks?: { url: string }[]
  websites?: { url: string; category: number }[]
  category?: number
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

export interface SteamReview {
  score: number
  total_positive: number
  total_negative: number
  total_reviews: number
}

export interface DiaryEntry {
  id: number
  game_id: number
  game_name: string
  game_cover_url: string | null
  played_at: string
  status: string
  rating: number | null
  note: string | null
  created_at: string
}

export interface GameListItem {
  id: number
  game_id: number
  game_name: string
  game_cover_url: string | null
  note: string | null
  position: number
  created_at: string
}

export interface GameList {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
  items?: GameListItem[]
}

export const GAME_STATUSES = ["Playing", "Completed", "Want to Play", "Dropped"] as const
export type GameStatus = typeof GAME_STATUSES[number]

export interface SteamShowcaseGame {
  app_id: number
  name: string
  playtime_minutes: number
  playtime_2weeks_minutes?: number
  image_url: string | null
}

export interface SteamShowcaseData {
  private: boolean
  total_games?: number
  total_playtime_minutes?: number
  top_games?: SteamShowcaseGame[]
  recent_games?: SteamShowcaseGame[]
  synced_at?: number
}

export interface ConnectedAccount {
  platform: string
  display_name: string | null
  avatar_url: string | null
  showcase_data: SteamShowcaseData | null
  last_synced_at: string | null
}

export interface MyConnection {
  platform: string
  external_id: string
  display_name: string | null
  avatar_url: string | null
  last_synced_at: string | null
}