export type BrowseCategory =
  | "trending"
  | "popular"
  | "upcoming"
  | "new"

const CATEGORIES: { value: BrowseCategory; label: string }[] = [
  { value: "trending", label: "TRENDING" },
  { value: "popular", label: "POPULAR" },
  { value: "upcoming", label: "UPCOMING" },
  { value: "new", label: "NEW RELEASES" },
]

export default function CategoryChips({
  value,
  onChange,
}: {
  value: BrowseCategory
  onChange: (next: BrowseCategory) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar pb-1">
      {CATEGORIES.map((c) => {
        const active = value === c.value
        return (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-sm text-[12px] font-semibold uppercase tracking-[.04em] transition ${
              active
                ? "bg-[var(--cp-accent)] text-white"
                : "text-[var(--cp-text-dim)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)]"
            }`}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
