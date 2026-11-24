"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SPECIES } from "@/app/lib/pets";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { requireUser } from "@/app/lib/session";
import { deletePhotoObjects, savePetPhoto } from "@/app/lib/pet-photo";

export type EditPetState = { error?: string };

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optional = (fd: FormData, k: string) => text(fd, k) || null;

export async function updatePet(
  petId: string,
  _prev: EditPetState,
  formData: FormData,
): Promise<EditPetState> {
  const session = await requireUser();
  const pet =
    (await getPetAccess(session.user.id, petId)) === "owner"
      ? await prisma.pet.findUnique({
          where: { id: petId },
          select: { id: true, photoKey: true, photoThumbKey: true },
        })
      : null;
  if (!pet) return { error: "We couldn't find this animal." };

  const name = text(formData, "name");
  const species = text(formData, "species");
  const color = text(formData, "color");
  const sex = text(formData, "sex");
  const birthDate = new Date(text(formData, "birthDate"));

  if (!name || !color) return { error: "Name and colour are required." };
  if (!SPECIES.includes(species)) return { error: "Choose what kind of animal this is." };
  if (sex !== "MALE" && sex !== "FEMALE") return { error: "Choose a sex." };
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
    return { error: "Enter a valid birthday that isn't in the future." };
  }

  const weightRaw = text(formData, "weightKg");
  let weightKg: number | null = null;
  if (weightRaw) {
    weightKg = Number(weightRaw);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 2000) {
      return { error: "Weight must be a positive number of kg." };
    }
  }

  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;
  let photoKey = pet.photoKey;
  let photoThumbKey = pet.photoThumbKey;
  const oldKeys = [pet.photoKey, pet.photoThumbKey];
  if (hasPhoto) {
    const saved = await savePetPhoto(pet.id, photo);
    if (!saved.ok) return { error: saved.error };
    photoKey = saved.photoKey;
    photoThumbKey = saved.photoThumbKey;
  } else if (formData.get("removePhoto") === "1") {
    photoKey = null;
    photoThumbKey = null;
  }

  await prisma.pet.update({
    where: { id: pet.id },
    data: {
      name,
      species,
      breed: optional(formData, "breed"),
      color,
      sex,
      birthDate,
      weightKg,
      microchip: optional(formData, "microchip"),
      allergies: optional(formData, "allergies"),
      photoKey,
      photoThumbKey,
    },
  });
  // The pet now points at the new photo (or none); clear the old files.
  if (photoKey !== pet.photoKey) await deletePhotoObjects(oldKeys);

  revalidatePath("/", "layout");
  redirect(`/pets/${pet.id}`);
}
