import PetShell from "../pet-shell";
import AppointmentTile from "@/app/components/appointment-tile";
import ReminderCard from "@/app/components/reminder-card";
import { startOfToday } from "@/app/lib/care";
import { getAccessiblePet } from "@/app/lib/pet-data";
import { visibleReminders } from "@/app/lib/pet-access";
import { requireUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

export default async function PetRemindersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getAccessiblePet(id);
  const session = await requireUser();
  const isOwner = pet.role === "owner";
  const mine = visibleReminders(session.user.id);
  const now = new Date();
  const weekAgo = new Date(startOfToday(now).getTime() - 6 * 86_400_000);

  const [open, appointments, done, doneThisWeek] = await Promise.all([
    prisma.reminder.findMany({
      where: { petId: pet.id, completedAt: null, AND: [mine] },
      orderBy: { dueAt: "asc" },
      include: { assignee: { select: { name: true } } },
    }),
    prisma.appointment.findMany({
      where: { petId: pet.id, status: "UPCOMING", scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.reminderCompletion.findMany({
      where: { reminder: { petId: pet.id, AND: [mine] } },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { reminder: { select: { title: true } }, completedBy: { select: { name: true } } },
    }),
    prisma.reminderCompletion.count({
      where: { reminder: { petId: pet.id, AND: [mine] }, completedAt: { gte: weekAgo } },
    }),
  ]);

  const today = startOfToday(now).getTime() + 86_400_000;
  const attention = open.filter((r) => r.dueAt.getTime() < today);
  const later = open.filter((r) => r.dueAt.getTime() >= today);
  const overdue = open.filter((r) => r.dueAt < startOfToday(now)).length;

  return (
    <PetShell pet={pet} active="reminders" crumb="Reminders">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          {open.length === 0 && appointments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
              {isOwner
                ? `Nothing scheduled for ${pet.name}. Add a reminder for feeding, meds or vaccines.`
                : `Nothing is assigned to you for ${pet.name} right now.`}
            </p>
          ) : null}
          {attention.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted">Needs attention</h2>
              <ul className="flex flex-col gap-3">
                {attention.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    petName={pet.name}
                    canDelete={isOwner}
                    viewerId={session.user.id}
                  />
                ))}
              </ul>
            </section>
          ) : null}
          {appointments.length > 0 || later.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted">Coming up</h2>
              <ul className="flex flex-col gap-3">
                {appointments.map((a) => (
                  <AppointmentTile key={a.id} appointment={a} petName={pet.name} />
                ))}
                {later.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    petName={pet.name}
                    canDelete={isOwner}
                    viewerId={session.user.id}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-3 rounded-xl bg-[#9ccdef] p-5">
          <h2 className="font-display text-[24px] leading-7 text-forest">This week</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white p-3">
              <p className="text-[22px] font-semibold leading-6">{doneThisWeek}</p>
              <p className="text-xs text-muted">done</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-[22px] font-semibold leading-6">{overdue}</p>
              <p className="text-xs text-muted">overdue</p>
            </div>
          </div>
          {done.length > 0 ? (
            <ul className="flex flex-col gap-1 text-[13px] text-ink">
              {done.map((c) => (
                <li key={c.id}>
                  {c.completedBy?.name ?? "Someone"} completed &ldquo;{c.reminder.title}&rdquo;
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>
    </PetShell>
  );
}
