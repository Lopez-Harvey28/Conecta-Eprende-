-- Non-destructive normalization step toward 3NF.
-- Keeps legacy columns/tables in place while adding normalized references,
-- joins, metrics, audit snapshots, risk reports, and roadmap formalization data.

ALTER TYPE "City" RENAME TO "LegacyCity";

ALTER TABLE "Provider" ADD COLUMN "cityId" TEXT;
ALTER TABLE "CatalogItem" ADD COLUMN "cityId" TEXT;

CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "City" (
  "id" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "legacyCode" "LegacyCity",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentCategoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderCategory" (
  "providerId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderCategory_pkey" PRIMARY KEY ("providerId","categoryId")
);

CREATE TABLE "ProviderBusinessHour" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "opensAt" TEXT,
  "closesAt" TEXT,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  CONSTRAINT "ProviderBusinessHour_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderDeliveryOption" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderDeliveryOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderMetrics" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "avgRating" DOUBLE PRECISION,
  "totalVerifiedReviews" INTEGER NOT NULL DEFAULT 0,
  "profileCompleteness" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "responseTimeHrs" DOUBLE PRECISION,
  "completedRequests" INTEGER NOT NULL DEFAULT 0,
  "requestsResponded" INTEGER NOT NULL DEFAULT 0,
  "suspiciousActivityPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderMetrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewAnalysis" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "sentimentScore" DOUBLE PRECISION,
  "qualitySignals" JSONB,
  "moderationFlags" JSONB,
  "generalScore" DOUBLE PRECISION,
  "algorithmVersion" TEXT NOT NULL DEFAULT 'v1-seeded',
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrustScoreSnapshot" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "profileCompleteScore" DOUBLE PRECISION NOT NULL,
  "contactVerifiedScore" DOUBLE PRECISION NOT NULL,
  "requestsRespondedScore" DOUBLE PRECISION NOT NULL,
  "requestsCompletedScore" DOUBLE PRECISION NOT NULL,
  "avgReviewScore" DOUBLE PRECISION NOT NULL,
  "responseTimeScore" DOUBLE PRECISION NOT NULL,
  "accountAgeFactor" DOUBLE PRECISION NOT NULL,
  "suspiciousActivityPenalty" DOUBLE PRECISION NOT NULL,
  "finalScore" DOUBLE PRECISION NOT NULL,
  "algorithmVersion" TEXT NOT NULL DEFAULT 'v1-rule-based',
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustScoreSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiskReport" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL,
  "suspiciousCyclesCount" INTEGER NOT NULL DEFAULT 0,
  "avgSearchTimeSeconds" DOUBLE PRECISION,
  "avgRequestToCompletionMinutes" DOUBLE PRECISION,
  "avgMessagesPerRequest" DOUBLE PRECISION,
  "newAccountsPercentage" DOUBLE PRECISION,
  "ratingConcentrationScore" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "recommendedAction" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  CONSTRAINT "RiskReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogItemCategory" (
  "catalogItemId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogItemCategory_pkey" PRIMARY KEY ("catalogItemId","categoryId")
);

CREATE TABLE "CatalogItemMetrics" (
  "id" TEXT NOT NULL,
  "catalogItemId" TEXT NOT NULL,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "inquiryCount" INTEGER NOT NULL DEFAULT 0,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogItemMetrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteOffer" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "amount" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'NIO',
  "priceLabel" TEXT,
  "deliveryTimeLabel" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuoteOffer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FormalizationStep" (
  "id" TEXT NOT NULL,
  "providerId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'ROADMAP',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FormalizationStep_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");
CREATE UNIQUE INDEX "City_legacyCode_key" ON "City"("legacyCode");
CREATE UNIQUE INDEX "City_departmentId_name_key" ON "City"("departmentId","name");
CREATE INDEX "City_departmentId_idx" ON "City"("departmentId");

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentCategoryId_idx" ON "Category"("parentCategoryId");

CREATE INDEX "Provider_cityId_idx" ON "Provider"("cityId");
CREATE INDEX "ProviderCategory_categoryId_idx" ON "ProviderCategory"("categoryId");
CREATE INDEX "ProviderCategory_isPrimary_idx" ON "ProviderCategory"("isPrimary");

CREATE INDEX "ProviderBusinessHour_providerId_idx" ON "ProviderBusinessHour"("providerId");
CREATE UNIQUE INDEX "ProviderBusinessHour_providerId_dayOfWeek_key" ON "ProviderBusinessHour"("providerId","dayOfWeek");

CREATE INDEX "ProviderDeliveryOption_providerId_idx" ON "ProviderDeliveryOption"("providerId");
CREATE UNIQUE INDEX "ProviderDeliveryOption_providerId_label_key" ON "ProviderDeliveryOption"("providerId","label");

CREATE UNIQUE INDEX "ProviderMetrics_providerId_key" ON "ProviderMetrics"("providerId");
CREATE INDEX "ProviderMetrics_trustScore_idx" ON "ProviderMetrics"("trustScore");
CREATE INDEX "ProviderMetrics_avgRating_idx" ON "ProviderMetrics"("avgRating");

CREATE UNIQUE INDEX "ReviewAnalysis_reviewId_key" ON "ReviewAnalysis"("reviewId");
CREATE UNIQUE INDEX "Review_requestId_providerId_reviewerId_key" ON "Review"("requestId","providerId","reviewerId");

CREATE INDEX "TrustScoreSnapshot_providerId_idx" ON "TrustScoreSnapshot"("providerId");
CREATE INDEX "TrustScoreSnapshot_calculatedAt_idx" ON "TrustScoreSnapshot"("calculatedAt");
CREATE INDEX "TrustScoreSnapshot_finalScore_idx" ON "TrustScoreSnapshot"("finalScore");

CREATE INDEX "RiskReport_providerId_idx" ON "RiskReport"("providerId");
CREATE INDEX "RiskReport_status_idx" ON "RiskReport"("status");
CREATE INDEX "RiskReport_reviewedByUserId_idx" ON "RiskReport"("reviewedByUserId");

CREATE INDEX "CatalogItem_cityId_idx" ON "CatalogItem"("cityId");
CREATE INDEX "CatalogItemCategory_categoryId_idx" ON "CatalogItemCategory"("categoryId");
CREATE INDEX "CatalogItemCategory_isPrimary_idx" ON "CatalogItemCategory"("isPrimary");

CREATE UNIQUE INDEX "CatalogItemMetrics_catalogItemId_key" ON "CatalogItemMetrics"("catalogItemId");

CREATE INDEX "QuoteOffer_requestId_idx" ON "QuoteOffer"("requestId");
CREATE INDEX "QuoteOffer_providerId_idx" ON "QuoteOffer"("providerId");
CREATE INDEX "QuoteOffer_status_idx" ON "QuoteOffer"("status");

CREATE UNIQUE INDEX "FormalizationStep_providerId_code_key" ON "FormalizationStep"("providerId","code");
CREATE INDEX "FormalizationStep_providerId_idx" ON "FormalizationStep"("providerId");
CREATE INDEX "FormalizationStep_sortOrder_idx" ON "FormalizationStep"("sortOrder");

ALTER TABLE "City" ADD CONSTRAINT "City_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProviderCategory" ADD CONSTRAINT "ProviderCategory_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderCategory" ADD CONSTRAINT "ProviderCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderBusinessHour" ADD CONSTRAINT "ProviderBusinessHour_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderDeliveryOption" ADD CONSTRAINT "ProviderDeliveryOption_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderMetrics" ADD CONSTRAINT "ProviderMetrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewAnalysis" ADD CONSTRAINT "ReviewAnalysis_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrustScoreSnapshot" ADD CONSTRAINT "TrustScoreSnapshot_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskReport" ADD CONSTRAINT "RiskReport_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskReport" ADD CONSTRAINT "RiskReport_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CatalogItemCategory" ADD CONSTRAINT "CatalogItemCategory_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogItemCategory" ADD CONSTRAINT "CatalogItemCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogItemMetrics" ADD CONSTRAINT "CatalogItemMetrics_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteOffer" ADD CONSTRAINT "QuoteOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormalizationStep" ADD CONSTRAINT "FormalizationStep_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
