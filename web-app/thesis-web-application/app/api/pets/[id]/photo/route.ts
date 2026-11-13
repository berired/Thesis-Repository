import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { getPetPhotoUrl } from "@/app/lib/storage";

// Owner-only: photos are private, so hand out a short-lived signed URL.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  const pet = await prisma.pet.findFirst({
    where: { id, ownerId: session.user.id },
    select: { photoKey: true },
  });
  if (!pet?.photoKey) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(await getPetPhotoUrl(pet.photoKey, 300), {
    headers: { "Cache-Control": "private, max-age=240" },
  });
}
