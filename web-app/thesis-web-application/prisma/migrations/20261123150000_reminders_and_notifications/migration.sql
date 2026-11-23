-- Phase 3: reminder types, repeat interval, assignee, completion log, notifications.

-- ReminderCategory: CARE -> OTHER, WALK -> EXERCISE, CHECKUP -> APPOINTMENT.
CREATE TYPE "ReminderCategory_new" AS ENUM ('MEDICATION', 'VACCINE', 'FEEDING', 'GROOMING', 'EXERCISE', 'HABITAT', 'APPOINTMENT', 'OTHER');
ALTER TABLE "reminder" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "reminder" ALTER COLUMN "category" TYPE "ReminderCategory_new"
  USING (
    CASE "category"::text
      WHEN 'CARE' THEN 'OTHER'
      WHEN 'WALK' THEN 'EXERCISE'
      WHEN 'CHECKUP' THEN 'APPOINTMENT'
      ELSE "category"::text
    END
  )::"ReminderCategory_new";
DROP TYPE "ReminderCategory";
ALTER TYPE "ReminderCategory_new" RENAME TO "ReminderCategory";
ALTER TABLE "reminder" ALTER COLUMN "category" SET DEFAULT 'OTHER';

ALTER TABLE "reminder"
  ADD COLUMN "repeatEvery" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "remindDayBefore" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "place" TEXT,
  ADD COLUMN "addToRecords" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "assigneeId" TEXT,
  ADD COLUMN "recordId" TEXT;

-- Existing reminders belong to the pet's owner.
UPDATE "reminder" r SET "assigneeId" = p."ownerId" FROM "pet" p WHERE p."id" = r."petId";

ALTER TABLE "reminder" ADD CONSTRAINT "reminder_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "reminder_recordId_idx" ON "reminder"("recordId");

CREATE TABLE "reminder_completion" (
  "id" TEXT NOT NULL,
  "reminderId" TEXT NOT NULL,
  "completedById" TEXT,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reminder_completion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reminder_completion_reminderId_completedAt_idx" ON "reminder_completion"("reminderId", "completedAt");
CREATE INDEX "reminder_completion_completedAt_idx" ON "reminder_completion"("completedAt");
ALTER TABLE "reminder_completion" ADD CONSTRAINT "reminder_completion_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminder_completion" ADD CONSTRAINT "reminder_completion_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "NotificationType" AS ENUM ('REMINDER_DUE', 'REMINDER_OVERDUE', 'REMINDER_SOON', 'APPOINTMENT_SOON', 'VET_RECORD', 'LOST_MESSAGE', 'SHARE_INVITE', 'CARETAKER_COMPLETED');

CREATE TABLE "notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "href" TEXT,
  "dedupeKey" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_userId_dedupeKey_key" ON "notification"("userId", "dedupeKey");
CREATE INDEX "notification_userId_readAt_createdAt_idx" ON "notification"("userId", "readAt", "createdAt");
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
