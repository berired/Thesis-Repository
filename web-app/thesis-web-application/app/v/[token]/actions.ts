"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { notify } from "@/app/lib/notifications";
import { clientKey, rateLimit } from "@/app/lib/rate-limit";
import { parseRecordFields, syncPetWeight } from "@/app/lib/records";
import {
  SESSION_COOKIE,
  SESSION_MINUTES,
  currentVetState,
  findRequest,
  newToken,
  sha256,
} from "@/app/lib/vet-access";

export type VetSubmitResult = { error: string } | { ok: true; petId: string; recordId: string };

/** The vet tapped Start: burn the link and begin a cookie-bound session. */
export async function startVetSession(token: string) {
  if (!(await rateLimit("vet-start", await clientKey(), 10, 600))) redirect(`/v/${token}`);

  const request = await findRequest(token);
  if (request) {
    const now = new Date();
    const secret = newToken();
    const sessionExpiresAt = new Date(now.getTime() + SESSION_MINUTES * 60_000);
    // Only one tap can win: the update matches a link that is still unburned.
    const won = await prisma.recordRequest.updateMany({
      where: {
        id: request.id,
        burnedAt: null,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { burnedAt: now, sessionHash: sha256(secret), sessionExpiresAt },
    });
    if (won.count === 1) {
      (await cookies()).set(SESSION_COOKIE, `${request.id}.${secret}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: sessionExpiresAt,
      });
    }
  }
  redirect(`/v/${token}`);
}

/** The vet submitted their one record. Spends the QR; files are attached afterwards. */
export async function submitVetRecord(token: string, fd: FormData): Promise<VetSubmitResult> {
  if (!(await rateLimit("vet-submit", await clientKey(), 20, 3600))) {
    return { error: "Too many attempts. Please wait a while and try again." };
  }
  const state = await currentVetState(token);
  if (state.kind !== "session") {
    return { error: "This session has ended. Ask the owner for a new QR." };
  }
  if (state.submitted) return { error: "A record was already sent with this QR." };

  const parsed = parseRecordFields(fd);
  if (!parsed.ok) return { error: parsed.error };
  const vetName = String(fd.get("vetName") ?? "")
    .trim()
    .slice(0, 120);
  if (!vetName) return { error: "Enter your name." };
  if (!parsed.data.clinic) return { error: "Enter the clinic name." };

  const { request } = state;
  const record = await prisma
    .$transaction(async (tx) => {
      // Claiming the QR and creating the record happen together, so it can't be used twice.
      const claimed = await tx.recordRequest.updateMany({
        where: {
          id: request.id,
          usedAt: null,
          revokedAt: null,
          sessionExpiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      const created = await tx.healthRecord.create({
        data: { ...parsed.data, petId: request.petId, source: "VET", vetName },
        select: { id: true },
      });
      await tx.recordRequest.update({ where: { id: request.id }, data: { recordId: created.id } });
      if (parsed.data.type === "WEIGHT") await syncPetWeight(tx, request.petId);
      return created;
    })
    .catch(() => null);
  if (!record) return { error: "This session has ended. Ask the owner for a new QR." };

  await notify({
    userId: request.pet.ownerId,
    type: "VET_RECORD",
    title: `${vetName} added a record for ${request.pet.name}`,
    body: `${parsed.data.title} · ${parsed.data.clinic}`,
    href: `/pets/${request.petId}/records/${record.id}`,
    dedupeKey: `vet-record:${request.id}`,
  }).catch((e) => console.error("Vet record notification failed", e));

  return { ok: true, petId: request.petId, recordId: record.id };
}
