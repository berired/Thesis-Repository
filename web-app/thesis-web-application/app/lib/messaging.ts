import { prisma } from "./prisma";
import { notify } from "./notifications";

/**
 * Lost-pet messaging rules, in one place.
 *
 * A thread joins a pet's owner and one signed-in finder who scanned its tag. It only
 * works while the pet is in lost mode, is not archived and has "Message me through
 * Pawket Book" switched on; otherwise it is unavailable to both sides (the rows are kept,
 * so switching lost mode back on picks the conversation up again).
 *
 * The owner side is always `pet.ownerId`, never someone the pet is shared with: people a
 * pet is shared with (Phase 7) never see these threads.
 */

export const MAX_MESSAGE_LENGTH = 1000;

export type Side = "owner" | "finder";

type PetState = {
  lostMode: boolean;
  archivedAt: Date | null;
  publicSettings: { allowMessage: boolean } | null;
};

/** A pet with no saved settings uses the default, which allows in-app messages. */
export function messagingOpen(pet: PetState) {
  return pet.lostMode && !pet.archivedAt && (pet.publicSettings?.allowMessage ?? true);
}

/**
 * One thread as seen by `userId`, or null when they are not part of it or it is unavailable.
 * `blocked` threads are still returned so the person who blocked can lift it.
 */
export async function loadThread(userId: string, threadId: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      finder: { select: { name: true } },
      pet: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          lostMode: true,
          archivedAt: true,
          owner: { select: { name: true } },
          publicSettings: { select: { allowMessage: true, showName: true, showOwnerName: true } },
        },
      },
    },
  });
  if (!thread) return null;

  const side: Side | null =
    thread.pet.ownerId === userId ? "owner" : thread.finderId === userId ? "finder" : null;
  if (!side) return null;
  if (!messagingOpen(thread.pet)) return null;

  const first = (name: string) => name.split(/\s+/)[0] ?? name;
  const settings = thread.pet.publicSettings;
  return {
    thread,
    side,
    blocked: thread.blockedAt !== null,
    /** Who the viewer is talking to, as that person has allowed to be shown. */
    otherName:
      side === "owner"
        ? first(thread.finder.name)
        : (settings?.showOwnerName ?? true)
          ? first(thread.pet.owner.name)
          : "The owner",
    petName: side === "owner" || (settings?.showName ?? true) ? thread.pet.name : "this pet",
  };
}

type UnreadRow = { threadId: string; unread: bigint };

/**
 * Unread messages per open thread for a user, counted from the other side's messages
 * newer than the viewer's last read time. Blocked and unavailable threads do not count.
 */
export async function unreadByThread(userId: string) {
  const rows = await prisma.$queryRaw<UnreadRow[]>`
    SELECT t."id" AS "threadId", count(m."id") AS "unread"
    FROM message_thread t
    JOIN pet p ON p."id" = t."petId"
    LEFT JOIN pet_public_settings s ON s."petId" = p."id"
    JOIN message m ON m."threadId" = t."id" AND m."senderId" <> ${userId}
    WHERE (p."ownerId" = ${userId} OR t."finderId" = ${userId})
      AND p."lostMode" AND p."archivedAt" IS NULL
      AND COALESCE(s."allowMessage", true)
      AND t."blockedAt" IS NULL
      AND m."createdAt" > COALESCE(
        CASE WHEN p."ownerId" = ${userId} THEN t."ownerReadAt" ELSE t."finderReadAt" END,
        to_timestamp(0))
    GROUP BY t."id"`;
  return new Map(rows.map((r) => [r.threadId, Number(r.unread)]));
}

export async function unreadMessageCount(userId: string) {
  let total = 0;
  for (const n of (await unreadByThread(userId)).values()) total += n;
  return total;
}

/** Puts a "new message" in the other side's bell, once per burst of unread messages. */
export async function notifyNewMessage(args: {
  threadId: string;
  recipientId: string;
  recipientReadAt: Date | null;
  fromName: string;
  petName: string;
  preview: string;
}) {
  await notify({
    userId: args.recipientId,
    type: "LOST_MESSAGE",
    title: `New message about ${args.petName}`,
    body: `${args.fromName}: ${args.preview.slice(0, 80)}`,
    href: `/messages/${args.threadId}`,
    // The key follows the recipient's last read time, so reading a thread re-arms the bell.
    dedupeKey: `lost-message:${args.threadId}:${args.recipientReadAt?.getTime() ?? 0}`,
  });
}
