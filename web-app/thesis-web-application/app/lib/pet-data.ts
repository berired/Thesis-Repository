import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import { getPetAccess } from "./pet-access";
import { requireUser } from "./session";

/** Loads one of the signed-in user's pets, or 404s. Shared between a page and its shell. */
export const getOwnedPet = cache(async (id: string) => {
  const session = await requireUser();
  if ((await getPetAccess(session.user.id, id)) !== "owner") notFound();
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      qrCode: { select: { code: true }},
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
