"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SPECIES } from "@/app/lib/pets";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { requireUser } from "@/app/lib/session";
import { deletePetPhoto, uploadPetPhoto } from "@/app/lib/storage";

export type EditPetState = { error?: string };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
          select: { id: true, photoKey: true },
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
  if (hasPhoto) {
    if (!PHOTO_TYPES[photo.type]) return { error: "Photo must be a JPG, PNG or WebP image." };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "Photo must be 5 MB or smaller." };
  }

  let photoKey = pet.photoKey;
  if (hasPhoto) {
    const key = `pet-photos/${pet.id}.${PHOTO_TYPES[photo.type]}`;
    try {
      await uploadPetPhoto(key, Buffer.from(await photo.arrayBuffer()), photo.type);
    } catch (e) {
      console.error("Pet photo upload failed", e);
      return { error: "We couldn't upload the photo. Try again." };
    }
    // A different file type means a different key, so clear the old file.
    if (pet.photoKey && pet.photoKey !== key) {
      await deletePetPhoto(pet.photoKey).catch((e) =>
        console.error("Old pet photo cleanup failed", e),
      );
    }
    photoKey = key;
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
    },
  });

  revalidatePath("/", "layout");
  redirect(`/pets/${pet.id}`);
}
