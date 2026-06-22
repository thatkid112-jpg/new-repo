import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { billingEnabled, createPortalSession } from "@/lib/billing";

export const runtime = "nodejs";

// Opens the Stripe Customer Portal (manage / cancel) for the signed-in user.
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
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet." }, { status: 400 });
  }

  try {
    const url = await createPortalSession(user.stripeCustomerId);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Portal failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
