-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "pet_share" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "ShareStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "pet_share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pet_share_userId_status_idx" ON "pet_share"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pet_share_petId_userId_key" ON "pet_share"("petId", "userId");

-- AddForeignKey
ALTER TABLE "pet_share" ADD CONSTRAINT "pet_share_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_share" ADD CONSTRAINT "pet_share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_share" ADD CONSTRAINT "pet_share_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
