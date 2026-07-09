-- Admin reviewer / super admin roles and moderation status support.

CREATE TABLE "RoleAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoleAssignment_userId_role_key" ON "RoleAssignment"("userId", "role");
CREATE INDEX "RoleAssignment_role_idx" ON "RoleAssignment"("role");

ALTER TABLE "RoleAssignment"
  ADD CONSTRAINT "RoleAssignment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Provider"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "suspendedUntil" TIMESTAMP(3),
  ADD COLUMN "statusUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "statusUpdatedById" TEXT;

CREATE INDEX "Provider_status_idx" ON "Provider"("status");
CREATE INDEX "Provider_statusUpdatedById_idx" ON "Provider"("statusUpdatedById");

ALTER TABLE "Provider"
  ADD CONSTRAINT "Provider_statusUpdatedById_fkey"
  FOREIGN KEY ("statusUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RiskReport"
  ADD COLUMN "reviewerNotes" TEXT,
  ADD COLUMN "escalatedAt" TIMESTAMP(3),
  ADD COLUMN "escalatedByUserId" TEXT,
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedByUserId" TEXT;

CREATE INDEX "RiskReport_escalatedByUserId_idx" ON "RiskReport"("escalatedByUserId");
CREATE INDEX "RiskReport_resolvedByUserId_idx" ON "RiskReport"("resolvedByUserId");

ALTER TABLE "RiskReport"
  ADD CONSTRAINT "RiskReport_escalatedByUserId_fkey"
  FOREIGN KEY ("escalatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RiskReport"
  ADD CONSTRAINT "RiskReport_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ModerationAuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ModerationAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModerationAuditLog_actorUserId_idx" ON "ModerationAuditLog"("actorUserId");
CREATE INDEX "ModerationAuditLog_action_idx" ON "ModerationAuditLog"("action");
CREATE INDEX "ModerationAuditLog_targetType_targetId_idx" ON "ModerationAuditLog"("targetType", "targetId");
CREATE INDEX "ModerationAuditLog_createdAt_idx" ON "ModerationAuditLog"("createdAt");

ALTER TABLE "ModerationAuditLog"
  ADD CONSTRAINT "ModerationAuditLog_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
