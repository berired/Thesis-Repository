-- AlterTable
ALTER TABLE "user" ADD COLUMN "animalTypes" TEXT;

-- Email verification is now required to sign in. Accounts created before this
-- change never had a verification email, so mark them verified.
UPDATE "user" SET "emailVerified" = true WHERE "emailVerified" = false;
