-- CreateEnum
CREATE TYPE "QrStatus" AS ENUM ('UNUSED', 'CLAIMED', 'REVOKED');

-- CreateTable
CREATE TABLE "qr_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "batch" TEXT,
    "status" "QrStatus" NOT NULL DEFAULT 'UNUSED',
    "imageKey" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "qr_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_code_code_key" ON "qr_code"("code");

-- CreateIndex
CREATE INDEX "qr_code_batch_idx" ON "qr_code"("batch");

-- CreateIndex
CREATE INDEX "qr_code_status_idx" ON "qr_code"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pet_qrCodeId_key" ON "pet"("qrCodeId");

-- CreateIndex
CREATE INDEX "pet_ownerId_idx" ON "pet"("ownerId");

-- AddForeignKey
ALTER TABLE "qr_code" ADD CONSTRAINT "qr_code_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;
