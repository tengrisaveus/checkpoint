import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { GAME_STATUSES } from "../types";
import type { Game, LibraryEntry } from "../types";
import { getCoverUrl, getYear } from "../utils";
import Toast from "../components/Toast";
import { DetailSkeleton } from "../components/Skeleton";
import PlatformIcon from "../components/PlatformIcon";
import StoreLink from "../components/StoreLink";
import AddToList from "../components/AddToList";
import useTitle from "../hooks/useTitle";

const STATUS_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Playing: "#3b82f6",
  "Want to Play": "#eab308",
  Dropped: "#ef4444",
};

function getBackdropUrl(game: Game): string | null {
  const source = game.artworks?.[0] || game.screenshots?.[0];
  if (!source?.url) return null;
  return `https:${source.url.replace("t_thumb", "t_1080p")}`;
}

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [existingEntry, setExistingEntry] = useState<LibraryEntry | null>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [diaryDate, setDiaryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [diaryNote, setDiaryNote] = useState("");
  const [expandSummary, setExpandSummary] = useState(false);
  const [similarGames, setSimilarGames] = useState<Game[]>([]);
  const [saving, setSaving] = useState(false);

  useTitle(game?.name || "Loading...");

  useEffect(() => {
    api
      .get(`/games/${id}`)
      .then((res) => setGame(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!user) return;
    api.get("/library").then((res) => {
      const found = res.data.find(
        (e: LibraryEntry) => e.game_id === Number(id),
      );
      if (found) {
        setExistingEntry(found);
        setStatus(found.status);
        setRating(found.rating);
        setReview(found.review || "");
      }
    }).catch(() => {});
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/games/${id}/similar`).then((res) => setSimilarGames(res.data)).catch(() => {});
  }, [id]);

  const handleSave = async () => {
    if (!status) {
      setError("Pick a status first");
      return;
    }
    setSaving(true);
    try {
      if (existingEntry) {
        await api.put(`/library/${id}`, { status, rating, review: review || null });
        setExistingEntry({ ...existingEntry, status, rating, review });
      } else {
        const res = await api.post("/library", {
          game_id: Number(id),
          status,
          rating,
          review: review || null,
        });
        setExistingEntry(res.data);
      }
      setSuccess(existingEntry ? "Updated!" : "Added to library!");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDiaryLog = async () => {
    if (!diaryDate) return;
    try {
      await api.post("/diary", {
        game_id: Number(id),
        played_at: diaryDate,
        status: status || null,
        rating,
        note: diaryNote || null,
      });
      setSuccess("Diary entry added!");
      setDiaryNote("");
      setDiaryOpen(false);
    } catch {
      setError("Something went wrong");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--cp-bg)] p-8">
        <div className="max-w-6xl mx-auto">
          <DetailSkeleton />
        </div>
      </div>
    );
  if (!game) return null;

  const backdrop = getBackdropUrl(game);
  const storeLinks = game.websites?.filter((w) => [1, 13, 16, 17].includes(w.category)) || [];
  const summaryLong = (game.summary?.length || 0) > 300;
  const developer = game.involved_companies?.find((c) => c.company)?.company.name;
  const statusColor = existingEntry ? STATUS_COLORS[existingEntry.status] : null;

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]">
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      {/* BACKDROP */}
      <div className="relative h-[240px] md:h-[360px] overflow-hidden">
        {backdrop ? (
          <img src={backdrop} alt="" className="w-full h-full object-cover scale-105 blur-[2px]" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--cp-surf)] to-[var(--cp-bg)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--cp-bg)] via-[var(--cp-bg)]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--cp-bg)]/60 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-48 md:-mt-56 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-white/50 hover:text-white text-xs font-mono uppercase tracking-[0.14em] mb-6 inline-flex items-center gap-2 transition"
        >
          ← Back
        </button>

        {/* 2-col layout: content + sticky rail */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
          {/* LEFT: content */}
          <div className="min-w-0">
            <div className="flex flex-col md:flex-row gap-5 md:gap-7 md:items-end">
              {getCoverUrl(game) ? (
                <img
                  src={getCoverUrl(game)!}
                  alt={game.name}
                  className="w-40 md:w-48 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-40 md:w-48 aspect-[3/4] bg-[var(--cp-surf)] rounded-lg flex items-center justify-center text-[var(--cp-text-dimmer)] ring-1 ring-white/10 cover-placeholder text-lg italic shrink-0">
                  {game.name}
                </div>
              )}

              <div className="flex-1 min-w-0 md:pb-2">
                <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-2">
                  {getYear(game.first_release_date) || "—"}
                  {developer && <> · {developer}</>}
                </div>
                <h1 className="font-display text-3xl md:text-[2.75rem] text-[var(--cp-text)] leading-[1.05] tracking-tight">
                  {game.name}
                </h1>

                {game.genres && (
                  <div className="flex gap-1.5 mt-4 flex-wrap">
                    {game.genres.slice(0, 5).map((g) => (
                      <span
                        key={g.name}
                        className="px-2.5 py-1 rounded-sm text-[11px] font-medium text-[var(--cp-accent)]/90 bg-[var(--cp-accent)]/10 border border-[var(--cp-accent)]/25 font-mono tracking-wide"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  {game.aggregated_rating && (
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-md flex items-center justify-center font-mono font-bold text-sm ring-1 ${
                          game.aggregated_rating >= 75
                            ? "bg-green-500/15 text-green-400 ring-green-500/30"
                            : game.aggregated_rating >= 50
                            ? "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30"
                            : "bg-red-500/15 text-red-400 ring-red-500/30"
                        }`}
                      >
                        {game.aggregated_rating.toFixed(0)}
                      </div>
                      <span className="font-mono text-[var(--cp-text-dimmer)] text-[10px] uppercase tracking-[0.14em]">
                        Critic
                      </span>
                    </div>
                  )}

                  {game.platforms && (
                    <div className="flex gap-1.5 flex-wrap">
                      {game.platforms.slice(0, 4).map((p) => (
                        <PlatformIcon key={p.name} name={p.name} abbreviation={p.abbreviation} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            {game.summary && (
              <div className="mt-8">
                <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-2">
                  About
                </div>
                <p
                  className={`text-[var(--cp-text-dim)] text-sm leading-relaxed ${
                    !expandSummary && summaryLong ? "line-clamp-5" : ""
                  }`}
                >
                  {game.summary}
                </p>
                {summaryLong && (
                  <button
                    onClick={() => setExpandSummary(!expandSummary)}
                    className="text-[var(--cp-accent)] text-xs mt-2 hover:brightness-110 transition font-medium"
                  >
                    {expandSummary ? "Show less" : "Read more →"}
                  </button>
                )}
              </div>
            )}

            {storeLinks.length > 0 && (
              <div className="mt-6">
                <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-2">
                  Where to buy
                </div>
                <div className="flex gap-2 flex-wrap">
                  {storeLinks.map((w, i) => (
                    <StoreLink key={i} url={w.url} category={w.category} />
                  ))}
                </div>
              </div>
            )}

            {similarGames.length > 0 && (
              <div className="mt-8">
                <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-3">
                  Similar games
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {similarGames.slice(0, 5).map((g) => (
                    <div
                      key={g.id}
                      onClick={() => navigate(`/game/${g.id}`)}
                      className="cursor-pointer group"
                    >
                      {getCoverUrl(g) ? (
                        <img
                          src={getCoverUrl(g)!}
                          alt={g.name}
                          className="w-full aspect-[3/4] object-cover rounded-md cover-hover"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-[var(--cp-surf)] rounded-md flex items-center justify-center text-[var(--cp-text-dimmer)] text-xs cover-placeholder italic p-2 text-center">
                          {g.name}
                        </div>
                      )}
                      <p className="text-[11px] text-[var(--cp-text-dim)] mt-1.5 truncate">{g.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-20" />
          </div>

          {/* RIGHT: sticky library rail */}
          <aside className="lg:sticky lg:top-4 space-y-3">
            {!user ? (
              <div className="border border-[var(--cp-border)] rounded-lg bg-[var(--cp-surf)]/60 p-6 text-center backdrop-blur-sm">
                <div className="font-display text-xl text-[var(--cp-text)] mb-1">Track this game</div>
                <p className="text-[var(--cp-text-dim)] text-sm mb-4">
                  Sign in to log your status, rating and review.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full px-4 py-2.5 rounded-sm bg-[var(--cp-accent)] text-white font-semibold text-sm hover:brightness-110 transition"
                >
                  Sign in
                </button>
              </div>
            ) : (
              <div className="border border-[var(--cp-border)] rounded-lg bg-[var(--cp-surf)]/70 backdrop-blur-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[var(--cp-border)] flex items-center justify-between">
                  <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase">
                    {existingEntry ? "▸ In your library" : "▸ Add to library"}
                  </div>
                  {existingEntry && statusColor && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                      <span
                        className="font-mono text-[10px] tracking-[0.12em] uppercase font-medium"
                        style={{ color: statusColor }}
                      >
                        {existingEntry.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* STATUS — segmented */}
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-2">
                      Status
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GAME_STATUSES.map((s) => {
                        const active = status === s;
                        const color = STATUS_COLORS[s];
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className="px-2.5 py-2 rounded-sm text-xs text-left transition flex items-center gap-2 border"
                            style={{
                              borderColor: active ? color : "var(--cp-border)",
                              background: active ? `${color}1a` : "transparent",
                              color: active ? color : "var(--cp-text-dim)",
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: color }}
                            />
                            <span className="truncate">{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* RATING — 10 cells */}
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-2 flex items-center justify-between">
                      <span>Your rating</span>
                      {rating ? (
                        <span className="text-[var(--cp-star)] tracking-normal normal-case">
                          {rating} / 10
                        </span>
                      ) : (
                        <span className="text-[var(--cp-text-dimmer)] tracking-normal normal-case">—</span>
                      )}
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                        const active = rating !== null && n <= rating;
                        return (
                          <button
                            key={n}
                            onClick={() => setRating(rating === n ? null : n)}
                            className="aspect-square rounded-sm text-[10px] font-mono font-semibold transition flex items-center justify-center"
                            style={{
                              background: active ? "var(--cp-star)" : "transparent",
                              color: active ? "var(--cp-bg)" : "var(--cp-text-dimmer)",
                              border: active
                                ? "1px solid var(--cp-star)"
                                : "1px solid var(--cp-border)",
                            }}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* REVIEW */}
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-2">
                      Review
                    </div>
                    <textarea
                      placeholder="A line or two about your experience…"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="w-full p-2.5 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)]/60 outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 resize-none border border-[var(--cp-border)] text-sm leading-relaxed"
                    />
                  </div>

                  {/* PRIMARY CTA */}
                  <button
                    onClick={handleSave}
                    disabled={!status || saving}
                    className="w-full py-2.5 rounded-sm bg-[var(--cp-accent)] text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving
                      ? "Saving…"
                      : existingEntry
                      ? "Save changes"
                      : "Add to library"}
                  </button>
                </div>

                {/* Secondary footer: diary + list toggles */}
                <div className="border-t border-[var(--cp-border)]">
                  <div className="grid grid-cols-2 divide-x divide-[var(--cp-border)]">
                    <button
                      onClick={() => {
                        setDiaryOpen(!diaryOpen);
                        setListOpen(false);
                      }}
                      className={`py-2.5 text-xs font-mono tracking-[0.1em] uppercase transition ${
                        diaryOpen
                          ? "text-[var(--cp-accent)] bg-[var(--cp-accent)]/5"
                          : "text-[var(--cp-text-dim)] hover:text-[var(--cp-text)]"
                      }`}
                    >
                      📖 Log diary
                    </button>
                    <button
                      onClick={() => {
                        setListOpen(!listOpen);
                        setDiaryOpen(false);
                      }}
                      className={`py-2.5 text-xs font-mono tracking-[0.1em] uppercase transition ${
                        listOpen
                          ? "text-[var(--cp-accent)] bg-[var(--cp-accent)]/5"
                          : "text-[var(--cp-text-dim)] hover:text-[var(--cp-text)]"
                      }`}
                    >
                      + Add to list
                    </button>
                  </div>

                  {diaryOpen && (
                    <div className="p-4 space-y-3 border-t border-[var(--cp-border)]">
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-1.5">
                          Date played
                        </div>
                        <input
                          type="date"
                          value={diaryDate}
                          onChange={(e) => setDiaryDate(e.target.value)}
                          className="w-full p-2 rounded-sm bg-transparent text-[var(--cp-text)] outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)] text-sm"
                        />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--cp-text-dimmer)] uppercase mb-1.5">
                          Note
                        </div>
                        <input
                          type="text"
                          placeholder="Quick thoughts…"
                          value={diaryNote}
                          onChange={(e) => setDiaryNote(e.target.value)}
                          maxLength={500}
                          className="w-full p-2 rounded-sm bg-transparent text-[var(--cp-text)] placeholder-[var(--cp-text-dimmer)]/60 outline-none focus:ring-1 focus:ring-[var(--cp-accent)]/50 border border-[var(--cp-border)] text-sm"
                        />
                      </div>
                      <button
                        onClick={handleDiaryLog}
                        disabled={!diaryDate}
                        className="w-full py-2 rounded-sm bg-transparent border border-[var(--cp-accent)]/60 text-[var(--cp-accent)] text-xs font-semibold hover:bg-[var(--cp-accent)]/10 transition disabled:opacity-40"
                      >
                        Log entry
                      </button>
                    </div>
                  )}

                  {listOpen && (
                    <div className="p-4 border-t border-[var(--cp-border)]">
                      <AddToList gameId={Number(id)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
