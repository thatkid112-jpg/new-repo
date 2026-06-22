import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { billingEnabled } from "@/lib/billing";
import { BillingButtons } from "@/components/BillingButtons";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function AccountPage() {
  const access = await getAccess();
  if (access.state === "anon") redirect("/signin?callbackUrl=/account");

  const subscribed = access.state === "subscribed";

  return (
    <div className="fade-in max-w-xl space-y-8 py-4">
      <header>
        <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-accent">
          Account
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          {access.email}
        </h1>
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.15em] text-muted">
          Archive subscription
        </h2>
        {subscribed ? (
          <p className="mt-2 text-sm text-ink">
            <span className="font-semibold text-accent">Active</span> · renews{" "}
            {fmtDate(access.subscription.currentPeriodEnd)}. You have full access to the
            historical trend archive.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No active subscription. Subscribe to unlock the full historical trend archive
            (everything older than the last 24 hours).
          </p>
        )}

        <div className="mt-4">
          <BillingButtons subscribed={subscribed} billingEnabled={billingEnabled()} />
        </div>
      </section>

      <Link href="/archive" className="text-sm font-medium text-accent hover:underline">
        → Go to the archive
      </Link>
    </div>
  );
}
