import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { MAX_FILES_PER_RECORD, keyBelongsToPet, verifyUploaded } from "@/app/lib/pet-files";
import { clientKeyFrom, rateLimit } from "@/app/lib/rate-limit";
import { currentVetState } from "@/app/lib/vet-access";
import { deleteFile } from "@/app/lib/storage";
import type { DocumentType } from "@/app/generated/prisma/client";

const DOCUMENT_TYPES: DocumentType[] = ["VACCINATION", "VET_VISIT", "LAB_RESULT", "OTHER"];

// Step 2 of a vet upload: check what landed in the bucket, then attach it to the vet's record.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!(await rateLimit("vet-files", clientKeyFrom(req.headers), 60, 3600))) {
    return NextResponse.json({ error: "Too many uploads. Please wait." }, { status: 429 });
  }
  const { token } = await params;
  const state = await currentVetState(token);
  if (state.kind !== "session" || !state.request.recordId) {
    return NextResponse.json({ error: "This session has ended." }, { status: 403 });
  }
  const { request } = state;

  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  if (!keyBelongsToPet(key, "vet-upload", request.petId)) {
    return NextResponse.json({ error: "Unknown upload." }, { status: 400 });
  }
  // The same key can't be attached twice.
  if (await prisma.petDocument.findFirst({ where: { fileKey: key }, select: { id: true } })) {
    return NextResponse.json({ error: "Unknown upload." }, { status: 400 });
  }

  const attached = await prisma.petDocument.count({ where: { recordId: request.recordId } });
  if (attached >= MAX_FILES_PER_RECORD) {
    await deleteFile(key).catch((e) => console.error("Over-limit upload cleanup failed", e));
    return NextResponse.json(
      { error: `A record can have at most ${MAX_FILES_PER_RECORD} files.` },
      { status: 400 },
    );
  }

  const stored = await verifyUploaded("vet-upload", key);
  if (!stored.ok) return NextResponse.json({ error: stored.error }, { status: 400 });

  const fileName =
    (typeof body?.fileName === "string" ? body.fileName : "")
      .replace(/[\/]/g, "_")
      .trim()
      .slice(0, 200) || "file";
  const type: DocumentType = DOCUMENT_TYPES.includes(body?.type) ? body.type : "OTHER";

  const doc = await prisma.petDocument.create({
    data: {
      petId: request.petId,
      recordId: request.recordId,
      title: fileName.slice(0, 120),
      type,
      fileKey: key,
      fileName,
      contentType: stored.contentType,
      sizeBytes: stored.sizeBytes,
    },
    select: { id: true, fileName: true, contentType: true, sizeBytes: true },
  });
  return NextResponse.json(doc, { status: 201 });
}
