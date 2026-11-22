import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { getSession } from "@/app/lib/session";
import { getPetPhotoUrl } from "@/app/lib/storage";

// Anyone with access to the pet: photos are private, so hand out a short-lived signed URL.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  if (!(await getPetAccess(session.user.id, id))) return new NextResponse(null, { status: 404 });
  const pet = await prisma.pet.findUnique({
    where: { id },
    select: { photoKey: true },
  });
  if (!pet?.photoKey) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(await getPetPhotoUrl(pet.photoKey, 300), {
    headers: { "Cache-Control": "private, max-age=240" },
  });
}
