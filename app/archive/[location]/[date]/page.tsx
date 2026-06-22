import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { getSnapshotsForDay } from "@/lib/queries";
import { computeStats, computeMovement } from "@/lib/stats";
import { StatsPanel } from "@/components/StatsPanel";
import { ViewTabs } from "@/components/ViewTabs";

export const metadata: Metadata = { title: "Archive", robots: { index: false } };

function dayLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function ArchiveDayPage({
  params,
}: {
  params: { location: string; date: string };
}) {
  const { location, date } = params;
  const access = await getAccess();

  if (access.state === "anon") {
    redirect(`/signin?callbackUrl=/archive/${location}/${date}`);
  }

  // Signed in but not subscribed → locked state with a conversion CTA.
  if (access.state !== "subscribed") {
    return (
      <div className="fade-in max-w-xl space-y-5 py-8 text-center">
        <p className="font-display text-5xl">🔒</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          This day is in the archive
        </h1>
        <p className="text-sm text-muted">
          Subscribe to unlock {dayLabel(date)} and every other past day of trend history.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/account"
            className="rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold text-white hover:opacity-90"
          >
            Subscribe
          </Link>
          <Link
            href="/archive"
            className="rounded-md border border-border px-4 py-2 font-display text-sm font-medium text-muted hover:text-ink"
          >
            Back to archive
          </Link>
        </div>
      </div>
    );
  }

  const view = await getSnapshotsForDay(location, date);
  if (!view) notFound();

  const stats = computeStats(view);
  const movement = computeMovement(view);

  return (
    <div className="fade-in space-y-8 py-4">
      <header>
        <Link href="/archive" className="text-sm font-medium text-accent hover:underline">
          ← All days
        </Link>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          {dayLabel(date)}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {view.name} · {view.snapshots.length} snapshot
          {view.snapshots.length === 1 ? "" : "s"} captured
        </p>
      </header>

      {view.snapshots.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-muted">
          No snapshots were captured on this day.
        </p>
      ) : (
        <>
          <StatsPanel stats={stats} />
          <section>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
              Snapshots through the day
            </h2>
            <ViewTabs
              locationSlug={view.slug}
              snapshots={view.snapshots}
              movement={movement}
            />
          </section>
        </>
      )}
    </div>
  );
}
