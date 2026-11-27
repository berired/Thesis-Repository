-- pgvector: stores and searches the knowledge-base embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "CareTipStatus" AS ENUM ('PENDING', 'READY', 'NO_SOURCE', 'FAILED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CARE_TIPS';

-- CreateTable
CREATE TABLE "care_tip" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "status" "CareTipStatus" NOT NULL DEFAULT 'PENDING',
    "tips" JSONB,
    "sources" JSONB,
    "allergyNote" TEXT,
    "detail" TEXT,
    "model" TEXT,
    "generatedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunk" (
    "id" TEXT NOT NULL,
    "entryKey" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "species" TEXT[],
    "aliases" TEXT[],
    "content" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(768),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "care_tip_recordId_key" ON "care_tip"("recordId");

-- CreateIndex
CREATE INDEX "care_tip_status_createdAt_idx" ON "care_tip"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunk_entryKey_chunkIndex_key" ON "knowledge_chunk"("entryKey", "chunkIndex");

-- AddForeignKey
ALTER TABLE "care_tip" ADD CONSTRAINT "care_tip_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
