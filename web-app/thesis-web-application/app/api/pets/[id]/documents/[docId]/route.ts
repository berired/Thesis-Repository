import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { getSession } from "@/app/lib/session";
import { presignFileDownload } from "@/app/lib/storage";

async function load(id: string, docId: string) {
  const session = await getSession();
  if (!session) return { status: 401 as const };
  const role = await getPetAccess(session.user.id, id);
  if (!role) return { status: 404 as const };
  const doc = await prisma.petDocument.findFirst({
    // Files of a voided record are kept for the audit trail but hidden from owners.
    where: { id: docId, petId: id, NOT: { record: { voidedAt: { not: null } } } },
    select: { id: true, fileKey: true, fileName: true, record: { select: { source: true } } },
  });
  if (!doc) return { status: 404 as const };
  return { role, doc };
}

// Anyone with access to the pet may open its files, through a 2 minute signed URL.
// The bucket is private, so there is no URL that works without going through here.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;
  const found = await load(id, docId);
  if ("status" in found) return new NextResponse(null, { status: found.status });

  return NextResponse.redirect(await presignFileDownload(found.doc.fileKey, found.doc.fileName), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

// Saved files can't be removed or replaced, so a record's attachments stay as they were
// uploaded. (They are only deleted along with their record or animal.)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;
  const found = await load(id, docId);
  if ("status" in found) return new NextResponse(null, { status: found.status });
  return new NextResponse(null, { status: 403 });
}
