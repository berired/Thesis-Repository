/*
  Warnings:

  - Added the required column `birthDate` to the `pet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `pet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `pet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PetSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('VACCINATION', 'VET_VISIT', 'LAB_RESULT', 'OTHER');

-- AlterTable
ALTER TABLE "pet" ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "birthDateApproximate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "breed" TEXT,
ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "markings" TEXT,
ADD COLUMN     "medicalNotes" TEXT,
ADD COLUMN     "microchip" TEXT,
ADD COLUMN     "neutered" BOOLEAN,
ADD COLUMN     "sex" "PetSex" NOT NULL,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "pet_document" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "documentDate" TIMESTAMP(3),
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pet_document_petId_idx" ON "pet_document"("petId");

-- AddForeignKey
ALTER TABLE "pet_document" ADD CONSTRAINT "pet_document_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
