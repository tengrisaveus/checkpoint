interface StoreLinkProps {
  url: string
  category: number
}

const STORE_INFO: Record<number, { name: string }> = {
  1: { name: "Official" },
  13: { name: "Steam" },
  16: { name: "Epic" },
  17: { name: "GOG" },
}

export default function StoreLink({ url, category }: StoreLinkProps) {
  const store = STORE_INFO[category]
  if (!store) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="px-3 py-2 rounded-sm font-mono text-xs uppercase tracking-wider bg-transparent text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] hover:border-[var(--cp-accent)]/40 transition inline-flex items-center gap-2 border border-[var(--cp-border)]"
    >
      {store.name} ↗
    </a>
  )
}
