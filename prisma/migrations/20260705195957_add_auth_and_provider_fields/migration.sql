-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "inquiryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "completedRequests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "mainCategory" TEXT,
ADD COLUMN     "verificationLevel" TEXT;

-- AlterTable
ALTER TABLE "QuoteThread" ADD COLUMN     "clientAvatar" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedByProviderAt" TIMESTAMP(3),
ADD COLUMN     "confirmedByRequesterAt" TIMESTAMP(3),
ADD COLUMN     "dateLabel" TEXT,
ADD COLUMN     "quotedDeliveryTime" TEXT,
ADD COLUMN     "quotedPriceLabel" TEXT;

-- CreateTable
CREATE TABLE "ProviderMedal" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "medalType" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceEvent" TEXT NOT NULL,

    CONSTRAINT "ProviderMedal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderMedal_providerId_idx" ON "ProviderMedal"("providerId");

-- CreateIndex
CREATE INDEX "Provider_mainCategory_idx" ON "Provider"("mainCategory");

-- AddForeignKey
ALTER TABLE "ProviderMedal" ADD CONSTRAINT "ProviderMedal_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
