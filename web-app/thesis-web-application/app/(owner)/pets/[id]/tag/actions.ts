"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { settingsFromForm } from "@/app/lib/scan-data";
import { requireUser } from "@/app/lib/session";

export type TagState = { error?: string; saved?: boolean } | undefined;

/** Saves which fields a stranger may see when they scan this pet's tag. Owner only. */
export async function savePublicSettings(petId: string, _prev: TagState, fd: FormData): Promise<TagState> {
  const session = await requireUser();
  if ((await getPetAccess(session.user.id, petId)) !== "owner") {
    return { error: "We couldn't find that animal." };
  }
  const { publicNote, ...switches } = settingsFromForm(fd);
  await prisma.petPublicSettings.upsert({
    where: { petId },
    create: { petId, publicNote: publicNote || null, ...switches },
    update: { publicNote: publicNote || null, ...switches },
  });
  revalidatePath(`/pets/${petId}/tag`);
  revalidatePath("/messages", "layout");
  return { saved: true };
}
