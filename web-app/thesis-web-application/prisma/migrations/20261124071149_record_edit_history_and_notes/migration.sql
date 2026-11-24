-- CreateTable
CREATE TABLE "record_edit" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "editorId" TEXT,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_edit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_note" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "record_edit_recordId_createdAt_idx" ON "record_edit"("recordId", "createdAt");

-- CreateIndex
CREATE INDEX "record_note_recordId_createdAt_idx" ON "record_note"("recordId", "createdAt");

-- AddForeignKey
ALTER TABLE "record_edit" ADD CONSTRAINT "record_edit_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_edit" ADD CONSTRAINT "record_edit_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_note" ADD CONSTRAINT "record_note_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_note" ADD CONSTRAINT "record_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
