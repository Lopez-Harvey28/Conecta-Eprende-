-- Add INACTIVE to the ProviderStatus enum (additive, non-destructive).
-- Existing rows keep their current status; new value is available for use.

ALTER TYPE "ProviderStatus" ADD VALUE IF NOT EXISTS 'INACTIVE';
