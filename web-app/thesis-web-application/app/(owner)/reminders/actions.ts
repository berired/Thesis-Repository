"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { notify } from "@/app/lib/notifications";
import { resolveAssignee } from "@/app/lib/caretakers";
import { getPetAccess, ownedPets, visibleReminders } from "@/app/lib/pet-access";
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

  // "me" (the default), "anyone" (whoever gets to it first) or one of this animal's caretakers.
  const who = await resolveAssignee(petId, String(fd.get("assignee") ?? "me"), session.user.id);
  if (!who.ok) return { error: who.error };

  await prisma.reminder.create({
    data: { ...parsed.data, petId, assigneeId: who.assigneeId },
  });
  refresh();
  redirect(safeNext(fd.get("next")));
}

/**
 * Marks a reminder done and logs who did it; repeating ones roll forward instead of closing.
 * Owners can complete any reminder on their animals; a caretaker only the ones assigned to
 * them or open to whoever gets to it first. When a caretaker does, the owner is told.
 */
export async function completeReminder(reminderId: string) {
  const session = await requireUser();
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, completedAt: null, AND: [visibleReminders(session.user.id)] },
    include: { pet: { select: { name: true, ownerId: true } } },
  });
  if (!reminder) return;

  const dueAt = reminder.dueAt;
  await prisma.$transaction((tx) => completeReminderIn(tx, reminder, session.user.id));

  if (reminder.pet.ownerId !== session.user.id) {
    await notify({
      userId: reminder.pet.ownerId,
      type: "CARETAKER_COMPLETED",
      title: `${session.user.name.split(/\s+/)[0]} completed ${reminder.title}`,
      body: reminder.pet.name,
      href: `/pets/${reminder.petId}/reminders`,
      dedupeKey: `caretaker-completed:${reminder.id}:${dueAt.getTime()}`,
    });
  }
  refresh();
}

export async function deleteReminder(reminderId: string) {
  const session = await requireUser();
  await prisma.reminder.deleteMany({
    where: { id: reminderId, pet: ownedPets(session.user.id) },
  });
  refresh();
}
