"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { notify } from "@/app/lib/notifications";
import { getPetAccess } from "@/app/lib/pet-access";
import { rateLimit } from "@/app/lib/rate-limit";
import { requireUser } from "@/app/lib/session";
import type { Prisma } from "@/app/generated/prisma/client";

export type ShareResult = { error: string } | { ok: true; message: string };

const MAX_CARETAKERS = 10;

function refresh(petId?: string) {
  revalidatePath("/pets", "layout");
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  if (petId) revalidatePath(`/pets/${petId}`, "layout");
}

/**
 * Ends a caretaker's access cleanly: their reminders go back to the owner and any vet QR they
 * made that hasn't been used is cancelled, so nothing they set up keeps working after they leave.
 */
async function endAccess(
  tx: Prisma.TransactionClient,
  share: { id: string; petId: string; userId: string },
  ownerId: string,
) {
  await tx.petShare.delete({ where: { id: share.id } });
  await tx.reminder.updateMany({
    where: { petId: share.petId, assigneeId: share.userId },
    data: { assigneeId: ownerId },
  });
  await tx.recordRequest.updateMany({
    where: { petId: share.petId, createdById: share.userId, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** The owner invites a registered user, by email, to help care for one of their animals. */
export async function inviteCaretaker(petId: string, emailRaw: string): Promise<ShareResult> {
  const session = await requireUser();
  if ((await getPetAccess(session.user.id, petId)) !== "owner") {
    return { error: "We couldn't find that animal." };
  }
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!(await rateLimit("share-invite", session.user.id, 10, 3600))) {
    return { error: "You've sent several invitations. Please try again in a while." };
  }

  const invitee = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });
  if (!invitee) {
    return {
      error: "No Pawket Book account uses that email. Ask them to sign up first, then invite them.",
    };
  }
  if (invitee.id === session.user.id) return { error: "You already own this animal." };

  const pet = await prisma.pet.findUniqueOrThrow({
    where: { id: petId },
    select: { name: true, _count: { select: { shares: true } } },
  });
  const existing = await prisma.petShare.findUnique({
    where: { petId_userId: { petId, userId: invitee.id } },
  });
  if (existing?.status === "ACCEPTED") return { error: `${invitee.name} is already a caretaker.` };
  if (existing?.status === "PENDING") return { error: `${invitee.name} already has an invitation.` };
  if (!existing && pet._count.shares >= MAX_CARETAKERS) {
    return { error: `An animal can have at most ${MAX_CARETAKERS} caretakers.` };
  }

  const now = new Date();
  const share = existing
    ? await prisma.petShare.update({
        where: { id: existing.id },
        data: { status: "PENDING", createdAt: now, respondedAt: null, invitedById: session.user.id },
      })
    : await prisma.petShare.create({
        data: { petId, userId: invitee.id, invitedById: session.user.id },
      });

  await notify({
    userId: invitee.id,
    type: "SHARE_INVITE",
    title: `${session.user.name.split(/\s+/)[0]} invited you to help care for ${pet.name}`,
    body: "Open My animals to accept or decline.",
    href: "/pets",
    // A new invitation after a decline gets its own notification.
    dedupeKey: `share-invite:${share.id}:${now.getTime()}`,
  });

  refresh(petId);
  return { ok: true, message: `Invitation sent to ${invitee.name}.` };
}

/** The invited person accepts or declines. Only their own pending invitation can be answered. */
export async function respondToInvite(shareId: string, accept: boolean): Promise<ShareResult> {
  const session = await requireUser();
  const share = await prisma.petShare.findFirst({
    where: { id: shareId, userId: session.user.id, status: "PENDING" },
    select: { id: true, petId: true },
  });
  if (!share) return { error: "That invitation is no longer open." };

  await prisma.petShare.update({
    where: { id: share.id },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
  refresh(share.petId);
  return { ok: true, message: accept ? "You're now a caretaker." : "Invitation declined." };
}

/** The owner removes a caretaker (or withdraws an invitation). Access ends at once. */
export async function removeCaretaker(shareId: string): Promise<ShareResult> {
  const session = await requireUser();
  const share = await prisma.petShare.findUnique({
    where: { id: shareId },
    select: { id: true, petId: true, userId: true, pet: { select: { ownerId: true } } },
  });
  if (!share || share.pet.ownerId !== session.user.id) {
    return { error: "We couldn't find that caretaker." };
  }
  await prisma.$transaction((tx) => endAccess(tx, share, share.pet.ownerId));
  refresh(share.petId);
  return { ok: true, message: "Caretaker removed." };
}

/** A caretaker stops helping with an animal. */
export async function leavePet(petId: string): Promise<ShareResult> {
  const session = await requireUser();
  const share = await prisma.petShare.findFirst({
    where: { petId, userId: session.user.id, status: "ACCEPTED" },
    select: { id: true, petId: true, userId: true, pet: { select: { ownerId: true } } },
  });
  if (!share) return { error: "You're not a caretaker for that animal." };
  await prisma.$transaction((tx) => endAccess(tx, share, share.pet.ownerId));
  refresh(petId);
  return { ok: true, message: "You've stopped helping with this animal." };
}
