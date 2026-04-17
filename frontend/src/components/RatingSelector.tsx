interface RatingSelectorProps {
  value: number | null
  onChange: (v: number | null) => void
  readonly?: boolean
}

export default function RatingSelector({ value, onChange, readonly }: RatingSelectorProps) {
  const handleClick = (n: number) => {
    if (readonly) return
    onChange(value === n ? null : n)
  }

  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => handleClick(n)}
          disabled={readonly}
          className={`w-8 h-8 rounded-sm text-sm font-mono font-medium transition ${
            value !== null && n <= value
              ? "bg-[var(--cp-star)] text-[var(--cp-bg)]"
              : "bg-transparent text-[var(--cp-text-dimmer)] border border-[var(--cp-border)] hover:border-[var(--cp-accent)]/50 hover:text-[var(--cp-text)]"
          } ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
