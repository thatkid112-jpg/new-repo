import { explainLatest, explanationsEnabled } from "../lib/explain";
import { prisma } from "../lib/db";

// CLI entry point: `npm run explain` — generates "why is this trending?" blurbs for
// the latest snapshot of every location. Cached topics are skipped.
async function main() {
  if (!explanationsEnabled()) {
    console.log("ANTHROPIC_API_KEY not set — explanations are disabled. Nothing to do.");
    return;
  }
  const locations = await prisma.location.findMany();
  for (const loc of locations) {
    const n = await explainLatest(loc.slug);
    console.log(`[${loc.slug}] generated ${n} new explanation(s).`);
  }
}

main()
  .catch((e) => {
    console.error("Explain run failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
