import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

/**
 * The single place that decides who may touch a pet.
 *
 * `owner`  - registered the pet; full control.
 * `viewer` - shared access (Phase 7); reads the pet and may be assigned reminders.
 *
 * Only owners exist until the sharing table lands in Phase 7. Everything that
 * reads or writes pet data goes through this file, so adding viewers means
 * changing it here and nowhere else.
 */
export type PetRole = "owner" | "viewer";

/** The user's role on one pet, or null when they have no access. */
export async function getPetAccess(userId: string, petId: string): Promise<PetRole | null> {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: userId },
    select: { id: true },
  });
  return pet ? "owner" : null;
}

/** Pets the user may read: for lists, counts and nested `pet: { ... }` filters. */
export function accessiblePets(userId: string): Prisma.PetWhereInput {
  return { ownerId: userId };
}

/** Pets the user may change (edit, archive, delete, add records). */
export function ownedPets(userId: string): Prisma.PetWhereInput {
  return { ownerId: userId };
}
