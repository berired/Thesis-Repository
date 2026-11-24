-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('RECORD_VOIDED', 'REPORT_DISMISSED');

-- CreateTable
CREATE TABLE "record_report" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "record_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entry" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "recordTitle" TEXT NOT NULL,
    "recordType" "RecordType" NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "vetName" TEXT,
    "clinic" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "record_report_status_createdAt_idx" ON "record_report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "record_report_recordId_idx" ON "record_report"("recordId");

-- CreateIndex
CREATE INDEX "audit_entry_createdAt_idx" ON "audit_entry"("createdAt");

-- CreateIndex
CREATE INDEX "audit_entry_recordId_idx" ON "audit_entry"("recordId");

-- AddForeignKey
ALTER TABLE "record_report" ADD CONSTRAINT "record_report_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_report" ADD CONSTRAINT "record_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
