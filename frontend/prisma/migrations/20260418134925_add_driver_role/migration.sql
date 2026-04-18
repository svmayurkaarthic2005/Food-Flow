-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DRIVER';

-- AlterTable
ALTER TABLE "Donor" ADD COLUMN     "locationSharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferences" JSONB NOT NULL DEFAULT '{"emailUpdates": true, "claimAlerts": true, "pickupReminders": true}';

-- AlterTable
ALTER TABLE "FoodListing" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "Ngo" ADD COLUMN     "locationSharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferences" JSONB NOT NULL DEFAULT '{"emailNotifications": true, "listingAlerts": true, "pickupNotifications": true}',
ADD COLUMN     "trustLabel" TEXT NOT NULL DEFAULT 'New NGO',
ADD COLUMN     "trustScore" INTEGER;

-- CreateTable
CREATE TABLE "DemandForecast" (
    "id" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "forecastDate" DATE NOT NULL,
    "predicted" INTEGER NOT NULL,
    "lowerCi" INTEGER NOT NULL,
    "upperCi" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorRating" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "ngoId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "foodQuality" INTEGER,
    "packaging" INTEGER,
    "timeliness" INTEGER,
    "communication" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandForecast_district_idx" ON "DemandForecast"("district");

-- CreateIndex
CREATE INDEX "DemandForecast_category_idx" ON "DemandForecast"("category");

-- CreateIndex
CREATE INDEX "DemandForecast_forecastDate_idx" ON "DemandForecast"("forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "DemandForecast_district_category_forecastDate_key" ON "DemandForecast"("district", "category", "forecastDate");

-- CreateIndex
CREATE INDEX "DonorRating_donorId_idx" ON "DonorRating"("donorId");

-- CreateIndex
CREATE INDEX "DonorRating_ngoId_idx" ON "DonorRating"("ngoId");

-- CreateIndex
CREATE INDEX "DonorRating_rating_idx" ON "DonorRating"("rating");

-- CreateIndex
CREATE INDEX "DonorRating_createdAt_idx" ON "DonorRating"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonorRating_claimId_key" ON "DonorRating"("claimId");

-- CreateIndex
CREATE INDEX "FoodListing_priority_idx" ON "FoodListing"("priority");

-- CreateIndex
CREATE INDEX "Ngo_trustScore_idx" ON "Ngo"("trustScore");

-- AddForeignKey
ALTER TABLE "DonorRating" ADD CONSTRAINT "DonorRating_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorRating" ADD CONSTRAINT "DonorRating_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "Ngo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorRating" ADD CONSTRAINT "DonorRating_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
