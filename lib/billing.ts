import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// Test-mode by default: set STRIPE_SECRET_KEY to a sk_test_... key. When the key
// or price is absent, billing is "disabled" and the UI shows a not-configured state.
const key = process.env.STRIPE_SECRET_KEY;
export const stripe = key ? new Stripe(key) : null;

export function billingEnabled(): boolean {
  return !!stripe && !!process.env.STRIPE_PRICE_ID;
}

function requireStripe(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  return stripe;
}

type BillingUser = { id: string; email: string; stripeCustomerId: string | null };

// Reuse one Stripe customer per user (persisted on User.stripeCustomerId).
export async function getOrCreateCustomer(user: BillingUser): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const s = requireStripe();
  const customer = await s.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function createCheckoutSession(user: BillingUser): Promise<string> {
  const s = requireStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRICE_ID is not set.");

  const customerId = await getOrCreateCustomer(user);
  const base = siteUrl();
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${base}/account?checkout=success`,
    cancel_url: `${base}/account?checkout=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const s = requireStripe();
  const base = siteUrl();
  const session = await s.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${base}/account`,
  });
  return session.url;
}

// Mirror a Stripe Subscription into our DB (source of truth for archive access).
// Reads the period end defensively across Stripe API versions (it has moved
// between the subscription top-level and the subscription item).
export async function upsertSubscriptionFromStripe(
  sub: Stripe.Subscription
): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
  if (!user) return; // unknown customer — nothing to attach the subscription to

  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? "";
  const periodEndUnix =
    (item as { current_period_end?: number } | undefined)?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  // Fall back to ~32 days out if Stripe omits it, so a just-paid user isn't locked.
  const currentPeriodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000)
    : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: sub.id,
      status: sub.status,
      priceId,
      currentPeriodEnd,
    },
    update: {
      stripeSubscriptionId: sub.id,
      status: sub.status,
      priceId,
      currentPeriodEnd,
    },
  });
}
