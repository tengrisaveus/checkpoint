import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import api from "../api"
import useTitle from "../hooks/useTitle"
import Toast from "../components/Toast"
import type { MyConnection } from "../types"

export default function Settings() {
  useTitle("Settings")
  const [params, setParams] = useSearchParams()
  const [connections, setConnections] = useState<MyConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const loadConnections = () => {
    api
      .get("/connections/me")
      .then((res) => setConnections(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadConnections()
  }, [])

  useEffect(() => {
    const flag = params.get("steam")
    if (flag === "connected") {
      setToast({ msg: "Steam connected", type: "success" })
      params.delete("steam")
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const handleConnectSteam = async () => {
    setBusy("steam-connect")
    try {
      const res = await api.get("/connections/steam/login")
      window.location.href = res.data.redirect_url
    } catch {
      setToast({ msg: "Could not start Steam connection", type: "error" })
      setBusy(null)
    }
  }

  const handleRefreshSteam = async () => {
    setBusy("steam-refresh")
    try {
      await api.post("/connections/steam/refresh")
      setToast({ msg: "Steam showcase refreshed", type: "success" })
      loadConnections()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setToast({ msg: message || "Refresh failed", type: "error" })
    } finally {
      setBusy(null)
    }
  }

  const handleDisconnectSteam = async () => {
    if (!confirm("Disconnect Steam? Your showcase will be removed from your profile.")) return
    setBusy("steam-disconnect")
    try {
      await api.delete("/connections/steam")
      setToast({ msg: "Steam disconnected", type: "success" })
      loadConnections()
    } catch {
      setToast({ msg: "Disconnect failed", type: "error" })
    } finally {
      setBusy(null)
    }
  }

  const steam = connections.find((c) => c.platform === "steam") || null

  return (
    <div className="min-h-screen bg-[var(--cp-bg)] p-6 md:p-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[var(--cp-text)] mb-2">Settings</h1>
        <p className="text-[var(--cp-text-dim)] text-sm mb-8">
          Connect your gaming accounts to display showcases on your public profile.
        </p>

        <p className="text-[13px] text-[var(--cp-text-dim)] font-medium mb-3 uppercase tracking-[.04em]">
          Connected accounts
        </p>

        {loading ? (
          <div className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg p-6 animate-pulse h-32" />
        ) : (
          <div className="space-y-3">
            <div className="bg-[var(--cp-surf)] border border-[var(--cp-border)] rounded-lg p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-[#1b2838] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--cp-text)] font-semibold">Steam</p>
                  {steam ? (
                    <p className="text-[12px] text-[var(--cp-text-dim)] truncate">
                      Connected as <span className="text-[var(--cp-text)]">{steam.display_name || steam.external_id}</span>
                      {steam.last_synced_at && (
                        <> · synced {new Date(steam.last_synced_at).toLocaleDateString()}</>
                      )}
                    </p>
                  ) : (
                    <p className="text-[12px] text-[var(--cp-text-dimmer)]">
                      Show your Steam playtime and recent games on your profile
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {steam ? (
                    <>
                      <button
                        onClick={handleRefreshSteam}
                        disabled={busy !== null}
                        className="px-3 py-1.5 rounded-sm border border-[var(--cp-border)] text-[12px] text-[var(--cp-text-dim)] hover:text-[var(--cp-text)] hover:border-[var(--cp-text-dimmer)] transition disabled:opacity-40"
                      >
                        {busy === "steam-refresh" ? "Refreshing…" : "Refresh"}
                      </button>
                      <button
                        onClick={handleDisconnectSteam}
                        disabled={busy !== null}
                        className="px-3 py-1.5 rounded-sm border border-[var(--cp-border)] text-[12px] text-red-400 hover:border-red-400/40 transition disabled:opacity-40"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleConnectSteam}
                      disabled={busy !== null}
                      className="px-4 py-1.5 rounded-sm bg-[var(--cp-accent)] text-white text-[12px] font-semibold hover:brightness-110 transition disabled:opacity-40"
                    >
                      {busy === "steam-connect" ? "Redirecting…" : "Connect"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[var(--cp-surf)]/40 border border-dashed border-[var(--cp-border)] rounded-lg p-5 opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-[var(--cp-surf-2)] flex items-center justify-center text-[var(--cp-text-dimmer)] font-bold text-lg shrink-0">
                  R
                </div>
                <div className="flex-1">
                  <p className="text-[var(--cp-text)] font-semibold">RetroAchievements</p>
                  <p className="text-[12px] text-[var(--cp-text-dimmer)]">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
