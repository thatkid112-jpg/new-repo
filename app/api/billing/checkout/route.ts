import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { billingEnabled, createCheckoutSession } from "@/lib/billing";

export const runtime = "nodejs";

// Starts a Stripe Checkout (subscription) for the signed-in user; returns the URL
// to redirect to. The webhook grants archive access once payment succeeds.
export async function POST() {
  if (!billingEnabled()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await createCheckoutSession({
      id: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    });
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
