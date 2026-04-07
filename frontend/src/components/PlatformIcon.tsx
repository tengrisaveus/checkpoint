interface PlatformIconProps {
  name: string
  abbreviation?: string
}

function PlatformSVG({ name }: { name: string }) {
  if (name.includes("PlayStation")) {
    return (
      <svg viewBox="0 0 50 50" className="w-4 h-4" fill="currentColor">
        <path d="M17.5 7.2v35.5l7.8 2.5V17.4c0-1.4.6-2.3 1.6-1.8 1 .5.8 1.8.8 3.2V32l7.8 2.5V14.8c0-2.6-.6-4.5-2.8-5.5C28.3 7 17.5 7.2 17.5 7.2zm15.3 27.5c2.9 1 6.5.2 7.3-1.8.8-2-1-3.8-3.9-4.8l-3.4-1.2v5.8l-7.8-2.5v-5.8l-7.8-2.5v2.5c0 0 9.8 3.2 15.6 5.3zM9.9 37.5c-3-1-3.7-3.2-2-4.5 1.5-1.2 4.2-2.1 4.2-2.1v-2.7S7 30.2 4.5 32c-2.5 1.8-2.8 5-1.2 6.8 1.8 2 5 2.8 8.5 2.5l-1.9-3.8z"/>
      </svg>
    )
  }
  if (name.includes("Xbox")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 1.5c1.4 0 2.7.3 3.9.9-1 .7-3.9 3.2-3.9 3.2S8.1 5.1 7.1 4.4c1.2-.6 2.5-.9 3.9-.9zM5.6 5.6c1.3.8 4 3.3 5.4 4.8-2 2.2-4.5 5.5-5.2 6.5C4.3 15.2 3.5 13.7 3.5 12c0-2.5 1-4.7 2.1-6.4zm12.8 0C19.5 7.3 20.5 9.5 20.5 12c0 1.7-.8 3.2-1.3 4.9-.7-1-3.2-4.3-5.2-6.5 1.4-1.5 4.1-4 5.4-4.8zM12 11.8c1.6 1.8 5 5.8 5.6 6.7-1.5 1-3.5 1.5-5.6 1.5s-4.1-.5-5.6-1.5c.6-.9 4-4.9 5.6-6.7z"/>
      </svg>
    )
  }
  if (name.includes("Switch") || name.includes("Nintendo")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M7.5 2C5.57 2 4 3.57 4 5.5v13C4 20.43 5.57 22 7.5 22H11V2H7.5zM8 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM13 2v20h3.5c1.93 0 3.5-1.57 3.5-3.5v-13C20 3.57 18.43 2 16.5 2H13zm3 8.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
      </svg>
    )
  }
  if (name.includes("PC") || name.includes("Windows") || name.includes("Mac") || name.includes("Linux")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M3 5.5l7.5-1v7H3V5.5zm0 13l7.5 1v-7H3v6zm8.5 1.2L21 21V12h-9.5v7.7zm0-14.4V12H21V3l-9.5 1.3z"/>
      </svg>
    )
  }
  return null
}

const PLATFORM_COLORS: Record<string, string> = {
  "PlayStation": "#006FCD",
  "Xbox": "#107C10",
  "PC": "#a78bba",
  "Windows": "#a78bba",
  "Mac": "#a78bba",
  "Linux": "#a78bba",
  "Nintendo": "#E60012",
  "Switch": "#E60012",
  "iOS": "#999",
  "Android": "#3DDC84",
}

function getColor(name: string): string {
  for (const [key, color] of Object.entries(PLATFORM_COLORS)) {
    if (name.includes(key)) return color
  }
  return "#a78bba"
}

export default function PlatformIcon({ name, abbreviation }: PlatformIconProps) {
  const color = getColor(name)
  const label = abbreviation || (name.includes("PC") ? "PC" : name)

  return (
    <span
      className="px-2 py-1 rounded text-xs font-medium border inline-flex items-center gap-1.5"
      style={{
        color: color,
        borderColor: color + "40",
        backgroundColor: color + "15",
      }}
    >
      <PlatformSVG name={name} />
      {label}
    </span>
  )
}