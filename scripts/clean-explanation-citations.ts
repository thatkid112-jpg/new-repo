import { stripCitations } from "../lib/explain";
import { prisma } from "../lib/db";

// One-off cleanup: strip inline citation links that got cached into Explanation.text
// before stripCitations() was applied at generation time. Safe to re-run (no-op on
// already-clean rows).
async function main() {
  const rows = await prisma.explanation.findMany();
  let updated = 0;
  for (const row of rows) {
    const cleaned = stripCitations(row.text);
    if (cleaned !== row.text) {
      await prisma.explanation.update({ where: { id: row.id }, data: { text: cleaned } });
      updated++;
    }
  }
  console.log(`Checked ${rows.length} explanation(s); cleaned ${updated}.`);
}

main()
  .catch((e) => {
    console.error("Cleanup run failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
