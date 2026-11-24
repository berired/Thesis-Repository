import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { presignFileDownload } from "@/app/lib/storage";

// Admin only: opens a file on a vet-submitted record (voided or not) so a report can be judged.
// Goes through a 2 minute signed URL like every other file; the bucket itself stays private.
export async function GET(_req: Request, { params }: { params: Promise<{ docId: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  if (session.user.role !== "admin") return new NextResponse(null, { status: 403 });

  const { docId } = await params;
  const doc = await prisma.petDocument.findFirst({
    where: { id: docId, record: { source: "VET" } },
    select: { fileKey: true, fileName: true },
  });
  if (!doc) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(await presignFileDownload(doc.fileKey, doc.fileName), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
