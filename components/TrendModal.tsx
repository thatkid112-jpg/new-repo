"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TrendDetail, Movement } from "@/lib/stats";
import { MovementBadge } from "./MovementBadge";
import { RankSparkline } from "./RankSparkline";

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface p-3 text-center">
      <div className="font-display text-[11px] font-bold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums text-ink">
        {children}
      </div>
    </div>
  );
}

function hoursAgo(iso: string | null): string {
  if (!iso) return "";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h <= 0) return "less than an hour ago";
  return h === 1 ? "about 1 hour ago" : `about ${h} hours ago`;
}

// In-page overlay shown when a hero-list trend is clicked. Uses only data we have
// (rank / best position / trending-for / movement + AI blurb + rank history).
export function TrendModal({
  detail,
  movement,
  blurb,
  onClose,
}: {
  detail: TrendDetail;
  movement?: Movement;
  blurb?: string;
  onClose: () => void;
}) {
  // Portal target only exists in the browser — gate on mount to stay SSR-safe.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  const shareText = `"${detail.name}" is trending on X right now`;
  const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(detail.url)}`;

  // Render through a portal to <body> so the fixed overlay escapes any transformed
  // ancestor (e.g. the .fade-in page wrapper) and is positioned against the viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${detail.name} details`}
    >
      {/* min-h-full + overflow-y-auto on the parent lets tall modals scroll on mobile
          instead of clipping (and trapping) the content. */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-ink">{detail.name}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-weak px-2.5 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Trending now
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Rank">
              {detail.currentRank != null ? `#${detail.currentRank}` : "—"}
            </StatCard>
            <StatCard label="Best position">
              {detail.bestRank != null ? `#${detail.bestRank}` : "—"}
            </StatCard>
            <StatCard label="Trending for">
              {detail.hoursTrending}
              <span className="text-base font-medium text-muted">h</span>
            </StatCard>
            <StatCard label="24h move">
              <MovementBadge movement={movement} />
            </StatCard>
          </div>

          {/* Narrative + blurb */}
          <div className="space-y-2 rounded-lg bg-surface p-4 text-sm">
            <p className="flex gap-2">
              <span className="text-accent">⚡</span>
              <span>
                Entered at{" "}
                <span className="font-medium">#{detail.firstRank ?? "?"}</span>{" "}
                {hoursAgo(detail.firstSeenAt)}
                {detail.bestRank != null && (
                  <> · peaked at <span className="font-medium">#{detail.bestRank}</span></>
                )}
                {detail.currentRank != null && (
                  <> · now <span className="font-medium">#{detail.currentRank}</span></>
                )}
              </span>
            </p>
            {blurb && (
              <p className="flex gap-2 text-muted">
                <span className="text-accent">⚡</span>
                <span>{blurb}</span>
              </p>
            )}
          </div>

          {/* Rank over time */}
          {detail.points.some((p) => p.rank != null) && (
            <div>
              <div className="mb-1 font-display text-[11px] font-bold uppercase tracking-wider text-muted">
                Rank over 24 hours
              </div>
              <div className="rounded-lg bg-surface p-3">
                <RankSparkline points={detail.points} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Share on X
            </a>
            <a
              href={detail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              View tweets on X
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
