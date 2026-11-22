-- Phase 0 schema cleanup: align RecordType with the vet + owner record types,
-- replace the clinic-confirmation AppointmentStatus with Upcoming/Done/Cancelled,
-- and make the appointment clinic name optional free text.

-- RecordType: rename in place (existing rows keep their meaning) and add OTHER.
ALTER TYPE "RecordType" RENAME VALUE 'VACCINE' TO 'VACCINATION';
ALTER TYPE "RecordType" RENAME VALUE 'CHECKUP' TO 'VET_VISIT';
ALTER TYPE "RecordType" RENAME VALUE 'LAB' TO 'LAB_RESULT';
ALTER TYPE "RecordType" ADD VALUE 'OTHER';

-- AppointmentStatus: AWAITING_CLINIC and CONFIRMED both become UPCOMING, COMPLETED becomes DONE.
CREATE TYPE "AppointmentStatus_new" AS ENUM ('UPCOMING', 'DONE', 'CANCELLED');
ALTER TABLE "appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "appointment" ALTER COLUMN "status" TYPE "AppointmentStatus_new"
  USING (
    CASE "status"::text
      WHEN 'AWAITING_CLINIC' THEN 'UPCOMING'
      WHEN 'CONFIRMED' THEN 'UPCOMING'
      WHEN 'COMPLETED' THEN 'DONE'
      ELSE "status"::text
    END
  )::"AppointmentStatus_new";
DROP TYPE "AppointmentStatus";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";
ALTER TABLE "appointment" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';

-- Clinic name is free text and optional.
ALTER TABLE "appointment" ALTER COLUMN "clinicName" DROP NOT NULL;
