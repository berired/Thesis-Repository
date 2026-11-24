import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import { getPetAccess, visibleReminders } from "./pet-access";
import { requireUser } from "./session";

/**
 * Loads a pet the signed-in user may read (as owner or caretaker), with their role, or 404s.
 * Shared between a page and its shell. Pages that change anything use `getOwnedPet` instead.
 */
export const getAccessiblePet = cache(async (id: string) => {
  const session = await requireUser();
  const role = await getPetAccess(session.user.id, id);
  if (!role) notFound();
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      qrCode: { select: { code: true } },
      owner: { select: { name: true } },
      _count: {
        select: {
          records: { where: { voidedAt: null } },
          // A caretaker's count only includes reminders they can see.
          reminders: { where: { completedAt: null, AND: [visibleReminders(session.user.id)] } },
        },
      },
    },
  });
  if (!pet) notFound();
  return { ...pet, role };
});

/** The same pet, but only for its owner: 404s for a caretaker. For pages that edit or add. */
export const getOwnedPet = cache(async (id: string) => {
  const pet = await getAccessiblePet(id);
  if (pet.role !== "owner") notFound();
  return pet;
});
