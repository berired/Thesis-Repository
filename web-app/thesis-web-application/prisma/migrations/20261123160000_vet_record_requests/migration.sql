
-- CreateEnum
CREATE TYPE "VetSection" AS ENUM ('ALLERGIES', 'VACCINES', 'MEDICATION', 'NOTES');

-- CreateTable
CREATE TABLE "record_request" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "sections" "VetSection"[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "burnedAt" TIMESTAMP(3),
    "sessionHash" TEXT,
    "sessionExpiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "recordId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "uploadCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "record_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "record_request_tokenHash_key" ON "record_request"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "record_request_recordId_key" ON "record_request"("recordId");

-- CreateIndex
CREATE INDEX "record_request_petId_createdAt_idx" ON "record_request"("petId", "createdAt");

-- AddForeignKey
ALTER TABLE "record_request" ADD CONSTRAINT "record_request_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_request" ADD CONSTRAINT "record_request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_request" ADD CONSTRAINT "record_request_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

