import { PrismaClient } from "@prisma/client";
import { mockTrendsFor } from "../lib/providers/mock";

const prisma = new PrismaClient();

// Seed the United States location plus ~24 hours of hourly mock snapshots, so the
// app shows a full timeline immediately on `npm run dev` with no API key.
async function main() {
  const location = await prisma.location.upsert({
    where: { slug: "united-states" },
    update: {},
    create: { slug: "united-states", name: "United States", woeid: 23424977 },
  });

  // Wipe existing snapshots for a clean, deterministic seed.
  await prisma.snapshot.deleteMany({ where: { locationId: location.id } });

  const now = new Date();
  now.setMinutes(0, 0, 0);

  let totalTrends = 0;
  for (let hoursAgo = 23; hoursAgo >= 0; hoursAgo--) {
    const capturedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    const trends = mockTrendsFor(location.slug, capturedAt);
    totalTrends += trends.length;

    await prisma.snapshot.create({
      data: {
        locationId: location.id,
        capturedAt,
        trends: {
          create: trends.map((t) => ({
            rank: t.rank,
            name: t.name,
            url: t.url,
            tweetVolume: t.tweetVolume ?? null,
          })),
        },
      },
    });
  }

  console.log(
    `Seeded "${location.name}" with 24 hourly snapshots (${totalTrends} trend rows).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
