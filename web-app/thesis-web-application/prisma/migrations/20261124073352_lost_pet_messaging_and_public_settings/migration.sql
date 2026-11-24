-- AlterTable
ALTER TABLE "user" ADD COLUMN     "city" TEXT;

-- CreateTable
CREATE TABLE "pet_public_settings" (
    "petId" TEXT NOT NULL,
    "showName" BOOLEAN NOT NULL DEFAULT true,
    "showSpecies" BOOLEAN NOT NULL DEFAULT true,
    "showAge" BOOLEAN NOT NULL DEFAULT true,
    "showGender" BOOLEAN NOT NULL DEFAULT true,
    "showOwnerName" BOOLEAN NOT NULL DEFAULT true,
    "showCity" BOOLEAN NOT NULL DEFAULT false,
    "allowCall" BOOLEAN NOT NULL DEFAULT false,
    "allowMessage" BOOLEAN NOT NULL DEFAULT true,
    "showAllergies" BOOLEAN NOT NULL DEFAULT false,
    "showVaccines" BOOLEAN NOT NULL DEFAULT false,
    "showMedication" BOOLEAN NOT NULL DEFAULT false,
    "showNotes" BOOLEAN NOT NULL DEFAULT false,
    "publicNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_public_settings_pkey" PRIMARY KEY ("petId")
);

-- CreateTable
CREATE TABLE "message_thread" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "finderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerReadAt" TIMESTAMP(3),
    "finderReadAt" TIMESTAMP(3),
    "blockedAt" TIMESTAMP(3),
    "blockedById" TEXT,

    CONSTRAINT "message_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread_report" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "thread_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_thread_finderId_lastMessageAt_idx" ON "message_thread"("finderId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "message_thread_petId_lastMessageAt_idx" ON "message_thread"("petId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_thread_petId_finderId_key" ON "message_thread"("petId", "finderId");

-- CreateIndex
CREATE INDEX "message_threadId_createdAt_idx" ON "message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "thread_report_status_createdAt_idx" ON "thread_report"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "pet_public_settings" ADD CONSTRAINT "pet_public_settings_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_thread" ADD CONSTRAINT "message_thread_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_thread" ADD CONSTRAINT "message_thread_finderId_fkey" FOREIGN KEY ("finderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_report" ADD CONSTRAINT "thread_report_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_report" ADD CONSTRAINT "thread_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
