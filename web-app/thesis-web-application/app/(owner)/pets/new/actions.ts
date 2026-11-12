"use server";

import { redirect } from "next/navigation";
import { SPECIES } from "@/app/lib/pets";
import { requireUser } from "@/app/lib/session";
import { claimQrAndCreatePet, extractCode } from "@/app/lib/claim-pet";

export type RegisterPetState = { error?: string };

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

  if (!name || !color) return { error: "Name and color are required." };
  if (!SPECIES.includes(species)) return { error: "Choose a species." };
  if (sex !== "MALE" && sex !== "FEMALE") return { error: "Choose a sex." };
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
    return { error: "Enter a valid birth date that isn't in the future." };
  }
  if (!code) return { error: "Scan or enter the QR code." };

  const weightRaw = text(formData, "weightKg");
  const weightKg = weightRaw ? Number(weightRaw) : null;
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg <= 0)) {
    return { error: "Weight must be a positive number." };
  }

  const neuteredRaw = text(formData, "neutered");

  const result = await claimQrAndCreatePet(session.user.id, code, {
    name,
    species,
    breed: optional(formData, "breed"),
    color,
    sex,
    birthDate,
    birthDateApproximate: formData.get("birthDateApproximate") === "on",
    neutered: neuteredRaw === "yes" ? true : neuteredRaw === "no" ? false : null,
    weightKg,
    microchip: optional(formData, "microchip"),
    markings: optional(formData, "markings"),
    medicalNotes: optional(formData, "medicalNotes"),
  });

  if (!result.ok) return { error: result.error };
  redirect(`/pets/${result.petId}`);
}
