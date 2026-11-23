import { prisma } from "./prisma";
import { accessiblePets } from "./pet-access";
import { fmtDay, fmtFull, fmtTime, startOfToday } from "./care";
import type { NotificationType } from "../generated/prisma/client";

const DAY = 86_400_000;

export type NewNotification = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  /** Identifies the event, so the same one is never delivered twice. */
  dedupeKey: string;
};

/** The one entry point later phases call to put something in a user's bell. */
export async function notify(...items: NewNotification[]) {
  if (items.length === 0) return;
  await prisma.notification.createMany({
    data: items.map((n) => ({ ...n, body: n.body ?? null, href: n.href ?? null })),
    skipDuplicates: true,
  });
}

export function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/**
 * Turns due, overdue and coming-up reminders and appointments into notifications.
 * There is no scheduler, so this runs whenever a signed-in owner page loads; the
 * dedupe key keeps repeat runs from creating duplicates.
 */
export async function syncDueNotifications(userId: string) {
  const now = new Date();
  const horizon = new Date(now.getTime() + DAY);
  const pets = { ...accessiblePets(userId), archivedAt: null };

  const [reminders, appointments] = await Promise.all([
    prisma.reminder.findMany({
      where: {
        completedAt: null,
        dueAt: { lte: horizon },
        OR: [{ assigneeId: userId }, { assigneeId: null }],
        pet: pets,
      },
      orderBy: { dueAt: "asc" },
      take: 100,
      include: { pet: { select: { name: true } } },
    }),
    prisma.appointment.findMany({
      where: { status: "UPCOMING", scheduledAt: { gt: now, lte: horizon }, pet: pets },
      orderBy: { scheduledAt: "asc" },
      take: 50,
      include: { pet: { select: { name: true } } },
    }),
  ]);

  const today = startOfToday(now);
  const items: NewNotification[] = [];

  for (const r of reminders) {
    const stamp = r.dueAt.getTime();
    const href = `/pets/${r.petId}/reminders`;
    if (r.dueAt < today) {
      items.push({
        userId,
        type: "REMINDER_OVERDUE",
        title: `${r.pet.name}'s ${r.title.toLowerCase()} is overdue`,
        body: `It was due ${fmtDay(r.dueAt)}. Mark it done or reschedule.`,
        href,
        dedupeKey: `reminder-overdue:${r.id}:${stamp}`,
      });
    } else if (r.dueAt <= now) {
      items.push({
        userId,
        type: "REMINDER_DUE",
        title: `${r.title} is due`,
        body: `${r.pet.name} · ${fmtTime(r.dueAt)}`,
        href,
        dedupeKey: `reminder-due:${r.id}:${stamp}`,
      });
    } else if (r.remindDayBefore) {
      items.push({
        userId,
        type: "REMINDER_SOON",
        title: `Coming up: ${r.title}`,
        body: `${r.pet.name} · ${fmtDay(r.dueAt)} at ${fmtTime(r.dueAt)}`,
        href,
        dedupeKey: `reminder-soon:${r.id}:${stamp}`,
      });
    }
  }

  for (const a of appointments) {
    items.push({
      userId,
      type: "APPOINTMENT_SOON",
      title: `Appointment coming up: ${a.title}`,
      body: `${a.pet.name} · ${fmtFull(a.scheduledAt)} at ${fmtTime(a.scheduledAt)}${a.clinicName ? ` · ${a.clinicName}` : ""}`,
      href: `/pets/${a.petId}/appointments`,
      dedupeKey: `appointment-soon:${a.id}:${a.scheduledAt.getTime()}`,
    });
  }

  await notify(...items);
}
