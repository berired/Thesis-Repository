-- Phase 2: type-specific record fields and provenance for vet-submitted records.

CREATE TYPE "RecordSource" AS ENUM ('OWNER', 'VET');

ALTER TABLE "health_record"
  ADD COLUMN "dose" TEXT,
  ADD COLUMN "batchNumber" TEXT,
  ADD COLUMN "startDate" TIMESTAMP(3),
  ADD COLUMN "endDate" TIMESTAMP(3),
  ADD COLUMN "nextDueDate" TIMESTAMP(3),
  ADD COLUMN "source" "RecordSource" NOT NULL DEFAULT 'OWNER',
  ADD COLUMN "voidedAt" TIMESTAMP(3),
  ADD COLUMN "voidedById" TEXT,
  ADD COLUMN "voidReason" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
