import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import { requireUser } from "./session";

/** Loads one of the signed-in user's pets, or 404s. Shared between a page and its shell. */
export const getOwnedPet = cache(async (id: string) => {
  const session = await requireUser();
  const pet = await prisma.pet.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      _count: {
        select: {
          records: true,
          reminders: { where: { completedAt: null } },
        },
      },
    },
  });
  if (!pet) notFound();
  return pet;
});

/** Same as above, but only for use in server actions that must also reject archived pets. */
export async function requireOwnedPetId(id: string) {
  const session = await requireUser();
  const pet = await prisma.pet.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!pet) throw new Error("Pet not found");
  return pet.id;
}
