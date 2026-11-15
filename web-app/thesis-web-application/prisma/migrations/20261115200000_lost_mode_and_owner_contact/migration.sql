-- AlterTable
ALTER TABLE "user"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "showPhone" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "showAddress" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pet" ADD COLUMN "lostMode" BOOLEAN NOT NULL DEFAULT false;
