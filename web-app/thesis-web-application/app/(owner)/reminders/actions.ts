"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess, ownedPets } from "@/app/lib/pet-access";
import { completeReminderIn, parseReminderFields } from "@/app/lib/reminders";
import { requireUser } from "@/app/lib/session";

export type ReminderFormState = { error?: string } | undefined;

function refresh() {
  revalidatePath("/", "layout");
}

/** Only same-site paths, so the form can't redirect somewhere else. */
function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : "/reminders";
}

export async function createReminder(
  _prev: ReminderFormState,
  fd: FormData,
): Promise<ReminderFormState> {
  const session = await requireUser();
  const petId = String(fd.get("petId") ?? "");
  if ((await getPetAccess(session.user.id, petId)) !== "owner") {
    return { error: "Choose one of your animals." };
  }
  const parsed = parseReminderFields(fd);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.reminder.create({
    data: { ...parsed.data, petId, assigneeId: session.user.id },
  });
  refresh();
  redirect(safeNext(fd.get("next")));
}

/** Marks a reminder done and logs who did it; repeating ones roll forward instead of closing. */
export async function completeReminder(reminderId: string) {
  const session = await requireUser();
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, completedAt: null, pet: ownedPets(session.user.id) },
  });
  if (!reminder) return;

  await prisma.$transaction((tx) => completeReminderIn(tx, reminder, session.user.id));
  refresh();
}

export async function deleteReminder(reminderId: string) {
  const session = await requireUser();
  await prisma.reminder.deleteMany({
    where: { id: reminderId, pet: ownedPets(session.user.id) },
  });
  refresh();
}
