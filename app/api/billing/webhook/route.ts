import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, upsertSubscriptionFromStripe } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe webhook — the single source of truth for archive entitlement.
// The raw request body must be passed to constructEvent unparsed for signature
// verification, so we read req.text() (never req.json()).
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not set." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (cs.subscription) {
          const subId =
            typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
