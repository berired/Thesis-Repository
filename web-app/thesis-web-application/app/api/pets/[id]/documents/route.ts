import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { MAX_FILES_PER_RECORD, keyBelongsToPet, verifyUploaded } from "@/app/lib/pet-files";
import { getPetAccess } from "@/app/lib/pet-access";
import { getSession } from "@/app/lib/session";
import { deleteFile } from "@/app/lib/storage";
import type { DocumentType } from "@/app/generated/prisma/client";

const DOCUMENT_TYPES: DocumentType[] = ["VACCINATION", "VET_VISIT", "LAB_RESULT", "OTHER"];

// Step 2 of an owner upload: the browser has PUT the file; check what actually
// landed in the bucket, then record it against the pet (and optionally a record).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  if ((await getPetAccess(session.user.id, id)) !== "owner") {
    return new NextResponse(null, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  if (!keyBelongsToPet(key, "document", id)) {
    return NextResponse.json({ error: "Unknown upload." }, { status: 400 });
  }

  const fileName =
    (typeof body?.fileName === "string" ? body.fileName : "")
      .replace(/[\/]/g, "_")
      .trim()
      .slice(0, 200) || "file";
  const title = (typeof body?.title === "string" ? body.title.trim() : "").slice(0, 120) || fileName;
  const type: DocumentType = DOCUMENT_TYPES.includes(body?.type) ? body.type : "OTHER";
  const date = body?.documentDate ? new Date(body.documentDate) : null;
  const documentDate = date && !Number.isNaN(date.getTime()) ? date : null;

  // A file attached to a record must attach to one of this pet's records, within the cap.
  let recordId: string | null = null;
  if (typeof body?.recordId === "string" && body.recordId) {
    // Owners can only attach files to their own records, never to vet-submitted or voided ones.
    const record = await prisma.healthRecord.findFirst({
      where: { id: body.recordId, petId: id, source: "OWNER", voidedAt: null },
      select: { id: true, _count: { select: { files: true } } },
    });
    if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    if (record._count.files >= MAX_FILES_PER_RECORD) {
      await deleteFile(key).catch((e) => console.error("Over-limit upload cleanup failed", e));
      return NextResponse.json(
        { error: `A record can have at most ${MAX_FILES_PER_RECORD} files.` },
        { status: 400 },
      );
    }
    recordId = record.id;
  }

  const stored = await verifyUploaded("document", key);
  if (!stored.ok) return NextResponse.json({ error: stored.error }, { status: 400 });

  const doc = await prisma.petDocument.create({
    data: {
      petId: id,
      recordId,
      title,
      type,
      documentDate,
      fileKey: key,
      fileName,
      contentType: stored.contentType,
      sizeBytes: stored.sizeBytes,
    },
    select: { id: true, title: true, fileName: true, contentType: true, sizeBytes: true },
  });
  return NextResponse.json(doc, { status: 201 });
}
