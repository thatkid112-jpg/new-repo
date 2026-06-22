import type { Subscription } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Entitlement is resolved fresh from the DB on every check (the Stripe webhook is
// the source of truth), so a cancellation re-locks the archive immediately — we
// never trust a stale entitlement baked into the session token.
export function isActive(sub: Subscription | null): sub is Subscription {
  if (!sub) return false;
  const live = sub.status === "active" || sub.status === "trialing";
  return live && sub.currentPeriodEnd.getTime() > Date.now();
}

export type Access =
  | { state: "anon" }
  | { state: "unsubscribed"; userId: string; email: string }
  | { state: "subscribed"; userId: string; email: string; subscription: Subscription };

export async function getAccess(): Promise<Access> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { state: "anon" };

  const email = session.user?.email ?? "";
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (isActive(sub)) {
    return { state: "subscribed", userId, email, subscription: sub };
  }
  return { state: "unsubscribed", userId, email };
}
