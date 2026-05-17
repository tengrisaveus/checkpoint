import type { SteamShowcaseData } from "../types"

interface Props {
  displayName: string | null
  avatarUrl: string | null
  data: SteamShowcaseData | null
}

function formatHours(minutes: number): string {
  const hours = Math.round(minutes / 60)
  if (hours < 1000) return `${hours}h`
  return `${(hours / 1000).toFixed(1)}k h`
}

export default function SteamShowcase({ displayName, avatarUrl, data }: Props) {
  if (!data) {
    return (
      <div className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg p-5">
        <SteamHeader displayName={displayName} avatarUrl={avatarUrl} />
        <p className="text-[13px] text-[var(--cp-text-dimmer)] mt-3">
          Showcase data is not available yet.
        </p>
      </div>
    )
  }

  if (data.private) {
    return (
      <div className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg p-5">
        <SteamHeader displayName={displayName} avatarUrl={avatarUrl} />
        <p className="text-[13px] text-[var(--cp-text-dim)] mt-3">
          This Steam profile is private. Public profile setting is required to display
          owned games and playtime.
        </p>
      </div>
    )
  }

  const topGames = data.top_games || []
  const recentGames = data.recent_games || []

  return (
    <div className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg p-5">
      <SteamHeader displayName={displayName} avatarUrl={avatarUrl} />

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="bg-[var(--cp-bg)] rounded-md p-3 border border-[var(--cp-border)]">
          <p className="text-[11px] text-[var(--cp-text-dimmer)] uppercase tracking-[.04em] mb-1">
            Library
          </p>
          <p className="font-mono tabular-nums text-2xl text-[var(--cp-text)]">
            {data.total_games?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-[var(--cp-text-dim)]">games owned</p>
        </div>
        <div className="bg-[var(--cp-bg)] rounded-md p-3 border border-[var(--cp-border)]">
          <p className="text-[11px] text-[var(--cp-text-dimmer)] uppercase tracking-[.04em] mb-1">
            Playtime
          </p>
          <p className="font-mono tabular-nums text-2xl text-[var(--cp-text)]">
            {formatHours(data.total_playtime_minutes || 0)}
          </p>
          <p className="text-[11px] text-[var(--cp-text-dim)]">across all games</p>
        </div>
      </div>

      {topGames.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] text-[var(--cp-text-dimmer)] uppercase tracking-[.04em] mb-2">
            Most played
          </p>
          <ul className="space-y-1.5">
            {topGames.slice(0, 5).map((g) => (
              <li key={g.app_id} className="flex items-center gap-3 text-[13px]">
                {g.image_url ? (
                  <img src={g.image_url} alt="" className="w-8 h-8 rounded-sm object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-sm bg-[var(--cp-surf-2)] shrink-0" />
                )}
                <span className="text-[var(--cp-text)] truncate flex-1">{g.name}</span>
                <span className="font-mono tabular-nums text-[12px] text-[var(--cp-text-dim)] shrink-0">
                  {formatHours(g.playtime_minutes)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentGames.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] text-[var(--cp-text-dimmer)] uppercase tracking-[.04em] mb-2">
            Recently played
          </p>
          <ul className="space-y-1.5">
            {recentGames.slice(0, 4).map((g) => (
              <li key={g.app_id} className="flex items-center gap-3 text-[13px]">
                {g.image_url ? (
                  <img src={g.image_url} alt="" className="w-8 h-8 rounded-sm object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-sm bg-[var(--cp-surf-2)] shrink-0" />
                )}
                <span className="text-[var(--cp-text)] truncate flex-1">{g.name}</span>
                <span className="font-mono tabular-nums text-[12px] text-[var(--cp-text-dim)] shrink-0">
                  {formatHours(g.playtime_2weeks_minutes || 0)} / 2w
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SteamHeader({ displayName, avatarUrl }: { displayName: string | null; avatarUrl: string | null }) {
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-10 h-10 rounded-md ring-1 ring-white/10" />
      ) : (
        <div className="w-10 h-10 rounded-md bg-[#1b2838] flex items-center justify-center text-white font-bold">
          S
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[var(--cp-text)] font-semibold truncate">{displayName || "Steam"}</p>
        <p className="text-[11px] text-[var(--cp-text-dimmer)] uppercase tracking-[.04em]">
          Steam
        </p>
      </div>
    </div>
  )
}
