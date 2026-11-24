import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { getSession } from "@/app/lib/session";
import { petPhotoUrl } from "@/app/lib/pet-photo";

// Anyone with access to the pet: photos are private, so hand out a short-lived signed URL.
// `?size=thumb` returns the small square copy (falls back to the large one for older photos).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  if (!(await getPetAccess(session.user.id, id))) return new NextResponse(null, { status: 404 });
  const pet = await prisma.pet.findUnique({
    where: { id },
    select: { photoKey: true, photoThumbKey: true },
  });
  if (!pet?.photoKey) return new NextResponse(null, { status: 404 });
  const thumb = new URL(req.url).searchParams.get("size") === "thumb";

  return NextResponse.redirect(await petPhotoUrl((thumb && pet.photoThumbKey) || pet.photoKey, 300), {
    headers: { "Cache-Control": "private, max-age=240" },
  });
}
