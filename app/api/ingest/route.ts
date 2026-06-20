import { NextRequest, NextResponse } from "next/server";
import { ingestAll } from "@/lib/ingest";

export const dynamic = "force-dynamic";
// Ingest pulls trends + generates blurbs; allow up to 60s (Vercel Hobby max).
export const maxDuration = 60;

// Runs one ingest cycle for all locations. Protected by a shared secret so only
// your cron (or you) can trigger it. Pass the secret as
// `Authorization: Bearer <INGEST_SECRET>` or `?secret=<INGEST_SECRET>`.
//
// POST is for manual/curl use; GET is also supported because Vercel Cron calls
// the path with GET (and sends Authorization: Bearer <CRON_SECRET> automatically
// when CRON_SECRET is set — set CRON_SECRET = INGEST_SECRET in your env).
async function handle(req: NextRequest) {
  const secret = process.env.INGEST_SECRET;
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.nextUrl.searchParams.get("secret") ??
    "";

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await ingestAll();
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
