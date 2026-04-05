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
          className={`w-8 h-8 rounded text-sm font-medium transition ${
            value !== null && n <= value
              ? "bg-yellow-400 text-[#0d0015]"
              : "bg-[#2d1b4e] text-[#a78bba] hover:bg-[#3d2b5e] hover:text-white"
          } ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}