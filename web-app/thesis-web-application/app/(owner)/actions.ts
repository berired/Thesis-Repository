"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess, ownedPets } from "@/app/lib/pet-access";
import { requireUser } from "@/app/lib/session";
import { deleteFile } from "@/app/lib/storage";
import { nextDue } from "@/app/lib/care";
import type {
  ReminderCategory,
  ReminderRepeat,
} from "@/app/generated/prisma/client";

export type FormState = { error?: string } | undefined;

const CATEGORIES: ReminderCategory[] = ["MEDICATION", "VACCINE", "CHECKUP", "CARE", "WALK"];
const REPEATS: ReminderRepeat[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

function text(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function optional(fd: FormData, key: string) {
  return text(fd, key) || null;
}

function parseDate(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The signed-in user's pet (archived or not), or throws. */
async function ownedPet(petId: string) {
  const session = await requireUser();
  if ((await getPetAccess(session.user.id, petId)) !== "owner") {
    throw new Error("Pet not found");
  }
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { id: true, name: true, qrCodeId: true },
  });
  if (!pet) throw new Error("Pet not found");
  return pet;
}

export async function createAppointment(
  petId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await ownedPet(petId);
  const title = text(fd, "title");
  const clinicName = optional(fd, "clinicName");
  const scheduledAt = parseDate(text(fd, "scheduledAt"));
  if (!title) return { error: "Give the appointment a title." };
  if (!scheduledAt) return { error: "Choose a date and time." };
  if (scheduledAt <= new Date()) return { error: "Choose a time in the future." };

  await prisma.appointment.create({
    data: { petId, title, clinicName, scheduledAt },
  });
  revalidatePath(`/pets/${petId}`, "layout");
  revalidatePath("/dashboard");
  redirect(`/pets/${petId}/appointments`);
}

export async function createReminder(
  petId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await ownedPet(petId);
  const title = text(fd, "title");
  const category = text(fd, "category") as ReminderCategory;
  const repeat = text(fd, "repeat") as ReminderRepeat;
  const dueAt = parseDate(text(fd, "dueAt"));
  if (!title) return { error: "Give the reminder a title." };
  if (!CATEGORIES.includes(category)) return { error: "Choose a category." };
  if (!REPEATS.includes(repeat)) return { error: "Choose how often it repeats." };
  if (!dueAt) return { error: "Choose a date and time." };

  await prisma.reminder.create({ data: { petId, title, category, repeat, dueAt } });
  revalidatePath(`/pets/${petId}`, "layout");
  revalidatePath("/dashboard");
  redirect(`/pets/${petId}`);
}

/** Marks a reminder done; repeating ones roll forward instead of closing. */
export async function completeReminder(reminderId: string) {
  const session = await requireUser();
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      completedAt: null,
      pet: ownedPets(session.user.id),
    },
  });
  if (!reminder) return;

  const next = nextDue(reminder.dueAt, reminder.repeat);
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: next ? { dueAt: next } : { completedAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function cancelAppointment(appointmentId: string) {
  const session = await requireUser();
  await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      status: "UPCOMING",
      pet: ownedPets(session.user.id),
    },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/", "layout");
}

export async function removePet(
  petId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const pet = await ownedPet(petId);
  const mode = text(fd, "mode");

  if (mode === "archive") {
    await prisma.pet.update({ where: { id: pet.id }, data: { archivedAt: new Date() } });
  } else if (mode === "delete") {
    const files = await prisma.petDocument.findMany({
      where: { petId: pet.id },
      select: { fileKey: true },
    });
    await prisma.$transaction(async (tx) => {
      // Records, reminders, appointments and documents go with the pet (cascade).
      await tx.pet.delete({ where: { id: pet.id } });
      // The physical tag can be registered again.
      if (pet.qrCodeId) {
        await tx.qrCode.update({
          where: { id: pet.qrCodeId },
          data: { status: "UNUSED", claimedAt: null },
        });
      }
    });
    // The rows cascaded away; remove the stored files too (best effort).
    await Promise.allSettled(files.map((f) => deleteFile(f.fileKey)));
  } else {
    return { error: "Choose archive or delete." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function setLostMode(petId: string, fd: FormData) {
  const pet = await ownedPet(petId);
  await prisma.pet.update({
    where: { id: pet.id },
    data: { lostMode: fd.get("lost") === "on" },
  });
  revalidatePath("/", "layout");
}

export async function restorePet(petId: string) {
  const pet = await ownedPet(petId);
  await prisma.pet.update({ where: { id: pet.id }, data: { archivedAt: null } });
  revalidatePath("/", "layout");
}
