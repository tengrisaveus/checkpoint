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
    <a href={url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded text-sm font-medium bg-[#2d1b4e] text-[#c4a8d8] hover:text-white transition inline-flex items-center gap-2 border border-[#3d2b5e]">
      {store.name} ↗
    </a>
  )
}