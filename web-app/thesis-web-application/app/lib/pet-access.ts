import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

/**
 * The single place that decides who may touch a pet.
 *
 * `owner`  - registered the pet; full control.
 * `viewer` - a caretaker whose invitation was accepted (a PetShare row). Can view the pet and
 *            its records, make vet QR codes, and be assigned reminders and complete them.
 *            Cannot edit the animal, add or change records, see the owner's contact details
 *            or read lost-pet messages.
 *
 * Everything that reads or writes pet data goes through this file. Removing a caretaker
 * deletes the share row, so their access ends on their next request.
 */
export type PetRole = "owner" | "viewer";

/** The user's role on one pet, or null when they have no access. */
export async function getPetAccess(userId: string, petId: string): Promise<PetRole | null> {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, OR: [{ ownerId: userId }, { shares: { some: { userId, status: "ACCEPTED" } } }] },
    select: { ownerId: true },
  });
  if (!pet) return null;
  return pet.ownerId === userId ? "owner" : "viewer";
}

/**
 * Pets the user may read: for lists, counts and nested `pet: { ... }` filters. Spread it and
 * add other keys (like `archivedAt`), but don't add your own `OR` next to it.
 */
export function accessiblePets(userId: string): Prisma.PetWhereInput {
  return { OR: [{ ownerId: userId }, { shares: { some: { userId, status: "ACCEPTED" } } }] };
}

/** Pets the user may change (edit, archive, delete, add records). Owners only. */
export function ownedPets(userId: string): Prisma.PetWhereInput {
  return { ownerId: userId };
}

/**
 * Reminders the user may see: every reminder on pets they own, and on pets shared with them
 * only the ones assigned to them or open to "whoever gets to it first" (no assignee).
 */
export function visibleReminders(userId: string): Prisma.ReminderWhereInput {
  return {
    OR: [
      { pet: { ownerId: userId } },
      {
        pet: { shares: { some: { userId, status: "ACCEPTED" } } },
        OR: [{ assigneeId: userId }, { assigneeId: null }],
      },
    ],
  };
}
