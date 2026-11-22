import { NextResponse } from "next/server";
import { createUpload } from "@/app/lib/pet-files";
import { getPetAccess } from "@/app/lib/pet-access";
import { getSession } from "@/app/lib/session";

// Step 1 of an owner upload: validate type and size, hand back a presigned PUT URL.
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
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const sizeBytes = typeof body?.sizeBytes === "number" ? body.sizeBytes : NaN;

  const upload = await createUpload("document", id, contentType, sizeBytes);
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: 400 });
  return NextResponse.json({ key: upload.key, url: upload.url, headers: upload.headers });
}
