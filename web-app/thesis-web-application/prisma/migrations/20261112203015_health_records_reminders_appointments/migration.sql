-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('VACCINE', 'WEIGHT', 'CHECKUP', 'MEDICATION', 'LAB');

-- CreateEnum
CREATE TYPE "ReminderCategory" AS ENUM ('MEDICATION', 'VACCINE', 'CHECKUP', 'CARE', 'WALK');

-- CreateEnum
CREATE TYPE "ReminderRepeat" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('AWAITING_CLINIC', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "pet" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pet_document" ADD COLUMN     "recordId" TEXT;

-- CreateTable
CREATE TABLE "health_record" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "type" "RecordType" NOT NULL,
    "title" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "clinic" TEXT,
    "vetName" TEXT,
    "notes" TEXT,
    "weightKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ReminderCategory" NOT NULL DEFAULT 'CARE',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "repeat" "ReminderRepeat" NOT NULL DEFAULT 'NONE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "clinicName" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'AWAITING_CLINIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_record_petId_recordDate_idx" ON "health_record"("petId", "recordDate");

-- CreateIndex
CREATE INDEX "reminder_petId_completedAt_dueAt_idx" ON "reminder"("petId", "completedAt", "dueAt");

-- CreateIndex
CREATE INDEX "appointment_petId_scheduledAt_idx" ON "appointment"("petId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "pet_document" ADD CONSTRAINT "pet_document_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_record" ADD CONSTRAINT "health_record_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
