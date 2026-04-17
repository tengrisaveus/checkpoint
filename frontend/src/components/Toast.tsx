import { useState, useEffect } from "react"

interface ToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-sm shadow-lg text-sm border transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      } ${
        type === "success"
          ? "bg-[var(--cp-surf)] text-[var(--cp-success)] border-[var(--cp-success)]/40"
          : "bg-[var(--cp-surf)] text-[var(--cp-accent)] border-[var(--cp-accent)]/40"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        <span
          className="status-dot"
          style={{ background: type === "success" ? "var(--cp-success)" : "var(--cp-accent)" }}
        />
        {message}
      </span>
    </div>
  )
}
