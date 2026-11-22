import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { getSession } from "@/app/lib/session";
import { deleteFile, presignFileDownload } from "@/app/lib/storage";

async function load(id: string, docId: string) {
  const session = await getSession();
  if (!session) return { status: 401 as const };
  const role = await getPetAccess(session.user.id, id);
  if (!role) return { status: 404 as const };
  const doc = await prisma.petDocument.findFirst({
    where: { id: docId, petId: id },
    select: { id: true, fileKey: true, fileName: true },
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

// Owner only.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;
  const found = await load(id, docId);
  if ("status" in found) return new NextResponse(null, { status: found.status });
  if (found.role !== "owner") return new NextResponse(null, { status: 403 });

  await prisma.petDocument.delete({ where: { id: found.doc.id } });
  await deleteFile(found.doc.fileKey).catch((e) => console.error("File delete failed", e));
  return new NextResponse(null, { status: 204 });
}
