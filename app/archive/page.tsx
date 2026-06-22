import type { Metadata } from "next";
import Link from "next/link";
import { getAccess } from "@/lib/access";
import { getArchiveDays } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Trend archive",
  description:
    "Browse the full history of US X (Twitter) trends — every hourly snapshot we've captured, going back further than the live 24-hour view.",
  robots: { index: false },
};

const LOCATION = "united-states";

function dayLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function ArchivePage() {
  const access = await getAccess();
  const index = await getArchiveDays(LOCATION);
  const days = index?.days ?? [];
  const subscribed = access.state === "subscribed";

  return (
    <div className="fade-in space-y-8 py-4">
      <header>
        <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-accent">
          The archive
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">
          {index?.name ?? "United States"} trend history
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          The live site only shows the last 24 hours. The archive keeps every hourly
          snapshot we’ve ever captured — {days.length} day{days.length === 1 ? "" : "s"} so
          far — so you can look up what was trending on any past date.
        </p>
      </header>

      {/* Access state banner */}
      {access.state === "anon" && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-ink">Sign in to access the archive.</p>
          <Link
            href="/signin?callbackUrl=/archive"
            className="mt-3 inline-block rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold text-white hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      )}

      {access.state === "unsubscribed" && (
        <div className="rounded-lg border-2 border-accent/40 bg-accent/5 p-5">
          <p className="font-display text-sm font-semibold text-ink">
            Unlock the full archive
          </p>
          <p className="mt-1 text-sm text-muted">
            Subscribe to open any past day below and see its full hourly timeline, ranked
            tables, and tag cloud.
          </p>
          <Link
            href="/account"
            className="mt-3 inline-block rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold text-white hover:opacity-90"
          >
            Subscribe
          </Link>
        </div>
      )}

      {/* Day list */}
      <section>
        <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Available days
        </h2>
        {days.length === 0 ? (
          <p className="text-sm text-muted">No snapshots captured yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {days.map((d) => {
              const label = dayLabel(d.date);
              const meta = `${d.snapshotCount} snapshot${d.snapshotCount === 1 ? "" : "s"}`;
              return (
                <li key={d.date}>
                  {subscribed ? (
                    <Link
                      href={`/archive/${LOCATION}/${d.date}`}
                      className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-surface"
                    >
                      <span className="font-medium text-ink">{label}</span>
                      <span className="tabular-nums text-muted">{meta}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-medium text-muted">{label}</span>
                      <span className="flex items-center gap-2 tabular-nums text-muted">
                        {meta}
                        <span aria-label="locked" title="Subscribe to unlock">
                          🔒
                        </span>
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
