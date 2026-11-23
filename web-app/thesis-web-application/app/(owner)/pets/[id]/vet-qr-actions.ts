"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { requireUser } from "@/app/lib/session";
import {
  LINK_HOURS,
  MAX_ACTIVE_PER_PET,
  SECTIONS,
  activeWhere,
  newToken,
  sha256,
  vetUrl,
} from "@/app/lib/vet-access";
import type { VetSection } from "@/app/generated/prisma/client";

export type VetQrResult =
  | { error: string }
  | { ok: true; url: string; svg: string; expiresAt: string };

/** Makes a one-time vet QR for a pet the signed-in user owns. The token is shown once, then only its hash exists. */
export async function createRecordRequest(
  petId: string,
  sections: string[],
): Promise<VetQrResult> {
  const session = await requireUser();
  if ((await getPetAccess(session.user.id, petId)) !== "owner") {
    return { error: "We couldn't find that animal." };
  }

  const allowed = SECTIONS.filter((s) => sections.includes(s)) as VetSection[];
  const now = new Date();
  const active = await prisma.recordRequest.count({ where: { petId, ...activeWhere(now) } });
  if (active >= MAX_ACTIVE_PER_PET) {
    return {
      error: `This animal already has ${MAX_ACTIVE_PER_PET} unused vet QR codes. Cancel one first.`,
    };
  }

  const token = newToken();
  const expiresAt = new Date(now.getTime() + LINK_HOURS * 3_600_000);
  await prisma.recordRequest.create({
    data: {
      petId,
      tokenHash: sha256(token),
      sections: allowed,
      createdById: session.user.id,
      expiresAt,
    },
  });

  const url = vetUrl(token);
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  revalidatePath(`/pets/${petId}`, "layout");
  return { ok: true, url, svg, expiresAt: expiresAt.toISOString() };
}

/** Cancels a QR that hasn't been used. Ends a vet session in progress too. */
export async function revokeRecordRequest(requestId: string) {
  const session = await requireUser();
  const request = await prisma.recordRequest.findUnique({
    where: { id: requestId },
    select: { id: true, petId: true },
  });
  if (!request || (await getPetAccess(session.user.id, request.petId)) !== "owner") return;

  await prisma.recordRequest.updateMany({
    where: { id: request.id, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  revalidatePath(`/pets/${request.petId}`, "layout");
}
