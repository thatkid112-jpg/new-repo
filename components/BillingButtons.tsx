"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

// Buttons on the account page. Subscribe / Manage billing POST to the billing API
// (which returns a Stripe URL to redirect to); sign-out uses Auth.js.
export function BillingButtons({
  subscribed,
  billingEnabled,
}: {
  subscribed: boolean;
  billingEnabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(endpoint: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not reach Stripe.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {subscribed ? (
          <button
            onClick={() => go("/api/billing/portal")}
            disabled={loading || !billingEnabled}
            className="rounded-md border border-border bg-card px-4 py-2 font-display text-sm font-medium text-ink transition-colors hover:border-accent disabled:opacity-50"
          >
            {loading ? "Opening…" : "Manage billing"}
          </button>
        ) : (
          <button
            onClick={() => go("/api/billing/checkout")}
            disabled={loading || !billingEnabled}
            className="rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Subscribe to the archive"}
          </button>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md border border-border px-4 py-2 font-display text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          Sign out
        </button>
      </div>

      {!billingEnabled && (
        <p className="text-sm text-muted">
          Billing isn’t configured yet (set <code>STRIPE_SECRET_KEY</code> and{" "}
          <code>STRIPE_PRICE_ID</code>).
        </p>
      )}
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}
