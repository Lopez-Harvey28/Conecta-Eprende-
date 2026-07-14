-- Drop the default temporarily (cannot cast text default to new enum automatically)
ALTER TABLE "Provider" ALTER COLUMN status DROP DEFAULT;

-- Create enum type
CREATE TYPE "ProviderStatus" AS ENUM ('DRAFT', 'ACTIVE', 'TEMPORARILY_RESTRICTED', 'SUSPENDED', 'BANNED');

-- Alter status column from text to enum (using explicit cast)
ALTER TABLE "Provider" ALTER COLUMN status TYPE "ProviderStatus" USING status::text::"ProviderStatus";

-- Set default value with proper enum cast
ALTER TABLE "Provider" ALTER COLUMN status SET DEFAULT 'ACTIVE'::"ProviderStatus";