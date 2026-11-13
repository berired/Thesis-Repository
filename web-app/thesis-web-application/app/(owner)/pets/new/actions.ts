"use server";

import { redirect } from "next/navigation";
import { SPECIES } from "@/app/lib/pets";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { claimQrAndCreatePet, extractCode } from "@/app/lib/claim-pet";
import { uploadPetPhoto } from "@/app/lib/storage";

export type RegisterPetState = { error?: string };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optional = (fd: FormData, k: string) => text(fd, k) || null;

export async function registerPet(
  _prev: RegisterPetState,
  formData: FormData,
): Promise<RegisterPetState> {
  const session = await requireUser();

  const name = text(formData, "name");
  const species = text(formData, "species");
  const color = text(formData, "color");
  const sex = text(formData, "sex");
  const birthDate = new Date(text(formData, "birthDate"));
  const code = extractCode(text(formData, "code"));

  if (!SPECIES.includes(species)) return { error: "Choose what kind of animal this is." };
  if (!name || !color) return { error: "Name and color are required." };
  if (sex !== "MALE" && sex !== "FEMALE") return { error: "Choose a sex." };
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
    return { error: "Enter a valid birthday that isn't in the future." };
  }
  if (!code) return { error: "Scan or enter the QR code from the tag." };

  // Weight is entered in g or kg; the database stores kg.
  const weightRaw = text(formData, "weight");
  let weightKg: number | null = null;
  if (weightRaw) {
    const value = Number(weightRaw);
    if (!Number.isFinite(value) || value <= 0) {
      return { error: "Weight must be a positive number." };
    }
    weightKg = text(formData, "weightUnit") === "g" ? value / 1000 : value;
  }

  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;
  if (hasPhoto) {
    if (!PHOTO_TYPES[photo.type]) return { error: "Photo must be a JPG, PNG or WebP image." };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "Photo must be 5 MB or smaller." };
  }

  const result = await claimQrAndCreatePet(session.user.id, code, {
    name,
    species,
    breed: optional(formData, "breed"),
    color,
    sex,
    birthDate,
    birthDateApproximate: formData.get("birthDateApproximate") === "on",
    neutered: null,
    weightKg,
    microchip: optional(formData, "microchip"),
    markings: null,
    allergies: optional(formData, "allergies"),
    medicalNotes: null,
  });

  if (!result.ok) return { error: result.error };

  // The pet is already saved; a failed upload shouldn't lose it.
  if (hasPhoto) {
    try {
      const key = `pet-photos/${result.petId}.${PHOTO_TYPES[photo.type]}`;
      await uploadPetPhoto(key, Buffer.from(await photo.arrayBuffer()), photo.type);
      await prisma.pet.update({ where: { id: result.petId }, data: { photoKey: key } });
    } catch (e) {
      console.error("Pet photo upload failed", e);
    }
  }

  redirect(`/pets/${result.petId}`);
}
