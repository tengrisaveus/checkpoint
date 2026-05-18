export type BrowseSort =
  | "default"
  | "rating"
  | "hype"
  | "year-desc"
  | "year-asc"
  | "name"

const SORT_LABELS: Record<BrowseSort, string> = {
  default: "Default",
  rating: "Rating",
  hype: "Hype",
  "year-desc": "Year ↓",
  "year-asc": "Year ↑",
  name: "A–Z",
}

export default function FilterBar({
  genres,
  activeGenre,
  onGenreChange,
  totalCount,
  sort,
  onSortChange,
}: {
  genres: { name: string; count: number }[]
  activeGenre: string | null
  onGenreChange: (next: string | null) => void
  totalCount: number
  sort: BrowseSort
  onSortChange: (next: BrowseSort) => void
}) {
  return (
    <div
      className="sticky top-[57px] z-20 backdrop-blur"
      style={{ backgroundColor: "rgba(10,6,16,0.78)" }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 py-3 border-b border-[var(--cp-border)]">
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => onGenreChange(null)}
            className={`shrink-0 px-3 py-1 rounded-sm text-xs font-medium transition ${
              activeGenre === null
                ? "bg-[var(--cp-accent)] text-white"
                : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50"
            }`}
          >
            All ({totalCount})
          </button>
          {genres.map((g) => {
            const active = activeGenre === g.name
            return (
              <button
                key={g.name}
                onClick={() => onGenreChange(active ? null : g.name)}
                className={`shrink-0 px-3 py-1 rounded-sm text-xs font-medium transition whitespace-nowrap ${
                  active
                    ? "bg-[var(--cp-accent)] text-white"
                    : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50"
                }`}
              >
                {g.name} ({g.count})
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[12px] text-[var(--cp-text-dim)]">
            {totalCount} {totalCount === 1 ? "game" : "games"}
          </span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as BrowseSort)}
            className="text-[12px] bg-transparent border border-[var(--cp-border)] rounded-sm px-2 py-1 text-[var(--cp-text-dim)] outline-none hover:border-[var(--cp-accent)]/40 transition"
          >
            {(Object.keys(SORT_LABELS) as BrowseSort[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
