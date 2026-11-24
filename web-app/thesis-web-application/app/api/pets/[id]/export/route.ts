import { NextResponse } from "next/server";
import { getPetAccess } from "@/app/lib/pet-access";
import { buildPetSummaryPdf } from "@/app/lib/pet-pdf";
import { rateLimit } from "@/app/lib/rate-limit";
import { getSession } from "@/app/lib/session";

// A printable health summary for one animal. The owner and the animal's caretakers can export it;
// everyone else gets 404. What it contains is decided in pet-pdf.ts and is the same for both.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  if (!(await getPetAccess(session.user.id, id))) return new NextResponse(null, { status: 404 });
  if (!(await rateLimit("pet-export", session.user.id, 20, 3600))) {
    return new NextResponse("Too many exports. Please try again later.", { status: 429 });
  }

  const pdf = await buildPetSummaryPdf(id);
  if (!pdf) return new NextResponse(null, { status: 404 });

  const fileName = `${pdf.name.replace(/[^A-Za-z0-9 _-]/g, "").trim() || "pet"}-health-summary.pdf`;
  return new NextResponse(Buffer.from(pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
