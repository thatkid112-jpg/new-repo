-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "woeid" INTEGER,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trend" (
    "id" SERIAL NOT NULL,
    "snapshotId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tweetVolume" INTEGER,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Explanation" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Explanation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE INDEX "Snapshot_locationId_capturedAt_idx" ON "Snapshot"("locationId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_locationId_capturedAt_key" ON "Snapshot"("locationId", "capturedAt");

-- CreateIndex
CREATE INDEX "Trend_name_idx" ON "Trend"("name");

-- CreateIndex
CREATE INDEX "Trend_snapshotId_idx" ON "Trend"("snapshotId");

-- CreateIndex
CREATE INDEX "Explanation_locationId_name_idx" ON "Explanation"("locationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Explanation_locationId_name_key" ON "Explanation"("locationId", "name");

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trend" ADD CONSTRAINT "Trend_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
