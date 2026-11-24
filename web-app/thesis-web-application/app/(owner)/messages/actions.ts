"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { rateLimit } from "@/app/lib/rate-limit";
import { requireUser } from "@/app/lib/session";
import {
  MAX_MESSAGE_LENGTH,
  loadThread,
  messagingOpen,
  notifyNewMessage,
} from "@/app/lib/messaging";

export type MessageResult = { error: string } | { ok: true };

/**
 * Starts (or reopens) the conversation between the signed-in finder and the owner of the pet
 * on the scanned tag. Only works while the pet is in lost mode and allows in-app messages.
 */
export async function startThread(code: string) {
  const session = await requireUser();
  const qr = await prisma.qrCode.findUnique({
    where: { code: code.toLowerCase() },
    select: {
      pet: {
        select: {
          id: true,
          ownerId: true,
          lostMode: true,
          archivedAt: true,
          publicSettings: { select: { allowMessage: true } },
        },
      },
    },
  });
  const pet = qr?.pet;
  // The owner is never "a finder", and a closed pet has no conversation to start.
  if (!pet || pet.ownerId === session.user.id || !messagingOpen(pet)) {
    redirect(`/r/${encodeURIComponent(code)}`);
  }

  const existing = await prisma.messageThread.findUnique({
    where: { petId_finderId: { petId: pet.id, finderId: session.user.id } },
    select: { id: true },
  });
  if (existing) redirect(`/messages/${existing.id}`);

  if (!(await rateLimit("thread-start", session.user.id, 5, 3600))) {
    redirect(`/r/${encodeURIComponent(code)}?limit=1`);
  }
  const thread = await prisma.messageThread.create({
    data: { petId: pet.id, finderId: session.user.id },
    select: { id: true },
  });
  redirect(`/messages/${thread.id}`);
}

/** Sends a message in a thread the signed-in user is part of. */
export async function sendMessage(threadId: string, body: string): Promise<MessageResult> {
  const session = await requireUser();
  const found = await loadThread(session.user.id, threadId);
  if (!found) return { error: "This conversation isn't available." };
  if (found.blocked) return { error: "This conversation is blocked." };

  const text = body.trim();
  if (!text) return { error: "Write a message first." };
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { error: `Keep messages under ${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (!(await rateLimit("message", session.user.id, 30, 600))) {
    return { error: "You're sending messages too fast. Wait a few minutes." };
  }

  const { thread, side } = found;
  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({ data: { threadId, senderId: session.user.id, body: text } }),
    prisma.messageThread.update({
      where: { id: threadId },
      // Sending counts as reading everything up to now.
      data: { lastMessageAt: now, ...(side === "owner" ? { ownerReadAt: now } : { finderReadAt: now }) },
    }),
  ]);

  await notifyNewMessage({
    threadId,
    recipientId: side === "owner" ? thread.finderId : thread.pet.ownerId,
    recipientReadAt: side === "owner" ? thread.finderReadAt : thread.ownerReadAt,
    fromName: session.user.name.split(/\s+/)[0] ?? session.user.name,
    petName: thread.pet.name,
    preview: text,
  });

  revalidatePath("/messages");
  return { ok: true };
}

/** Either side can block a conversation; whoever blocked it can lift the block. */
export async function setBlocked(threadId: string, blocked: boolean): Promise<MessageResult> {
  const session = await requireUser();
  const found = await loadThread(session.user.id, threadId);
  if (!found) return { error: "This conversation isn't available." };
  if (!blocked && found.thread.blockedById !== session.user.id) {
    return { error: "Only the person who blocked this conversation can unblock it." };
  }

  await prisma.messageThread.update({
    where: { id: threadId },
    data: blocked
      ? { blockedAt: new Date(), blockedById: session.user.id }
      : { blockedAt: null, blockedById: null },
  });
  revalidatePath("/messages", "layout");
  return { ok: true };
}

/** Reports a conversation to the admin. It is also blocked, so nothing more can be sent. */
export async function reportThread(threadId: string, reason: string): Promise<MessageResult> {
  const session = await requireUser();
  const found = await loadThread(session.user.id, threadId);
  if (!found) return { error: "This conversation isn't available." };

  const text = reason.trim();
  if (text.length < 5) return { error: "Tell the admin what happened, in a few words." };
  if (text.length > 500) return { error: "Keep the reason under 500 characters." };
  if (!(await rateLimit("thread-report", session.user.id, 5, 86_400))) {
    return { error: "You've sent several reports today. Please wait." };
  }

  await prisma.$transaction([
    prisma.threadReport.create({
      data: { threadId, reporterId: session.user.id, reason: text },
    }),
    prisma.messageThread.update({
      where: { id: threadId },
      data: found.blocked
        ? {}
        : { blockedAt: new Date(), blockedById: session.user.id },
    }),
  ]);
  revalidatePath("/messages", "layout");
  revalidatePath("/admin/messages");
  return { ok: true };
}
