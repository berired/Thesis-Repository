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
  requestOrigin,
  sha256,
  vetUrl,
} from "@/app/lib/vet-access";
import type { VetSection } from "@/app/generated/prisma/client";

export type VetQrResult =
  | { error: string }
  | { ok: true; url: string; svg: string; expiresAt: string };

/** Makes a one-time vet QR for a pet the signed-in user owns or is a caretaker for. The token is shown once, then only its hash exists. */
export async function createRecordRequest(
  petId: string,
  sections: string[],
): Promise<VetQrResult> {
  const session = await requireUser();
  // Owners and caretakers can both make one; nobody else can.
  if (!(await getPetAccess(session.user.id, petId))) {
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

  // The link uses the address the owner is on right now, so the QR opens on this same site.
  const url = vetUrl(token, await requestOrigin());
  // A wider quiet zone (2 squares) than before helps phone cameras lock on.
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
  revalidatePath(`/pets/${petId}`, "layout");
  return { ok: true, url, svg, expiresAt: expiresAt.toISOString() };
}

/**
 * Cancels a QR that hasn't been used. Ends a vet session in progress too. The owner can cancel
 * any QR for their animal; a caretaker only the ones they made.
 */
export async function revokeRecordRequest(requestId: string) {
  const session = await requireUser();
  const request = await prisma.recordRequest.findUnique({
    where: { id: requestId },
    select: { id: true, petId: true, createdById: true },
  });
  if (!request) return;
  const role = await getPetAccess(session.user.id, request.petId);
  if (role !== "owner" && !(role === "viewer" && request.createdById === session.user.id)) return;

  await prisma.recordRequest.updateMany({
    where: { id: request.id, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  revalidatePath(`/pets/${request.petId}`, "layout");
}
