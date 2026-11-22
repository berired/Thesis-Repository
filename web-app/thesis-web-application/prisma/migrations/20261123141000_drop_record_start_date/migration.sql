-- A medication's start date is the record's own date, so a separate column is redundant.
ALTER TABLE "health_record" DROP COLUMN "startDate";
