-- Align DB default with Prisma schema: schema.prisma has @default(DRAFT),
-- but migration 20260711200000 incorrectly set the DB default to ACTIVE.
-- Future inserts that omit status would expose providers publicly by default,
-- conflicting with Task 1's draft-first visibility rule.
ALTER TABLE "Provider" ALTER COLUMN status SET DEFAULT 'DRAFT'::"ProviderStatus";