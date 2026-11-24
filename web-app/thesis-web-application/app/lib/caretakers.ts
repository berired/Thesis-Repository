import { prisma } from "./prisma";

/** Accepted caretakers of the given animals, for "who does it" choices on the owner's forms. */
export async function caretakersOf(petIds: string[]) {
  if (petIds.length === 0) return [];
  const shares = await prisma.petShare.findMany({
    where: { status: "ACCEPTED", petId: { in: petIds } },
    select: { petId: true, userId: true, user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return shares.map((s) => ({ petId: s.petId, userId: s.userId, name: s.user.name }));
}

export type CaretakerOption = Awaited<ReturnType<typeof caretakersOf>>[number];

/**
 * Turns a form choice into an assignee: "me" (the owner), "anyone" (whoever gets to it first,
 * stored as no assignee) or the id of one of this animal's accepted caretakers.
 */
export async function resolveAssignee(
  petId: string,
  choice: string,
  ownerId: string,
): Promise<{ ok: true; assigneeId: string | null } | { ok: false; error: string }> {
  if (choice === "anyone") return { ok: true, assigneeId: null };
  if (choice === "me" || choice === "") return { ok: true, assigneeId: ownerId };
  const share = await prisma.petShare.findFirst({
    where: { petId, userId: choice, status: "ACCEPTED" },
    select: { userId: true },
  });
  if (!share) return { ok: false, error: "Choose one of this animal's caretakers." };
  return { ok: true, assigneeId: share.userId };
}

/** The reverse, for filling a form from saved reminders. */
export function choiceFor(assigneeId: string | null, ownerId: string) {
  return assigneeId === null ? "anyone" : assigneeId === ownerId ? "me" : assigneeId;
}
