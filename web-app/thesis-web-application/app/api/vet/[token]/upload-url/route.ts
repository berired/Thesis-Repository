import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { MAX_FILES_PER_RECORD, createUpload } from "@/app/lib/pet-files";
import { clientKeyFrom, rateLimit } from "@/app/lib/rate-limit";
import { MAX_UPLOADS_PER_SESSION, currentVetState } from "@/app/lib/vet-access";

// Step 1 of a vet upload: the QR session (cookie) must be live and the record already sent.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!(await rateLimit("vet-upload", clientKeyFrom(req.headers), 60, 3600))) {
    return NextResponse.json({ error: "Too many uploads. Please wait." }, { status: 429 });
  }
  const { token } = await params;
  const state = await currentVetState(token);
  if (state.kind !== "session" || !state.request.recordId) {
    return NextResponse.json({ error: "This session has ended." }, { status: 403 });
  }
  const { request } = state;

  const attached = await prisma.petDocument.count({ where: { recordId: request.recordId } });
  if (attached >= MAX_FILES_PER_RECORD) {
    return NextResponse.json(
      { error: `A record can have at most ${MAX_FILES_PER_RECORD} files.` },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const sizeBytes = typeof body?.sizeBytes === "number" ? body.sizeBytes : NaN;

  // The cap counts hand-outs, so a session can't be used to fill the bucket.
  const slot = await prisma.recordRequest.updateMany({
    where: { id: request.id, uploadCount: { lt: MAX_UPLOADS_PER_SESSION } },
    data: { uploadCount: { increment: 1 } },
  });
  if (slot.count !== 1) {
    return NextResponse.json({ error: "Upload limit reached for this session." }, { status: 429 });
  }

  const upload = await createUpload("vet-upload", request.petId, contentType, sizeBytes);
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: 400 });
  return NextResponse.json({ key: upload.key, url: upload.url, headers: upload.headers });
}
