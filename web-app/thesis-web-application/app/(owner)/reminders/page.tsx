import { dayKey, fmtHeading } from "@/app/lib/time";
import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import AppointmentTile from "@/app/components/appointment-tile";
import Icon from "@/app/components/app-icon";
import ReminderCard from "@/app/components/reminder-card";
import { StickerLink } from "@/app/components/ui";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  fmtDay,
  fmtTime,
  repeatLabel,
  startOfToday,
} from "@/app/lib/care";
import { accessiblePets } from "@/app/lib/pet-access";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { REMINDER_TYPES } from "@/app/lib/reminders";
import type { Prisma, ReminderCategory } from "@/app/generated/prisma/client";

type Tab = "upcoming" | "overdue" | "done" | "all";
const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "done", label: "Done" },
  { key: "all", label: "All reminders" },
];
type Search = { tab?: string; pet?: string; type?: string };

function dayHeading(d: Date, now: Date) {
  const day = dayKey(d);
  const today = dayKey(now);
  const label = fmtHeading(d);
  if (day === today) return `Today · ${label}`;
  if (day === today + 86_400_000) return `Tomorrow · ${label}`;
  return label;
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await requireUser();
  const { tab: tabParam, pet: petParam, type: typeParam } = await searchParams;
  const now = new Date();
  const today = startOfToday(now);
  const tab = TABS.find((t) => t.key === tabParam)?.key ?? "upcoming";

  const pets = await prisma.pet.findMany({
    where: { ...accessiblePets(session.user.id), archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const activePet = pets.find((p) => p.id === petParam);
  const activeType = REMINDER_TYPES.find((t) => t === typeParam) as ReminderCategory | undefined;
  const petIds = activePet ? [activePet.id] : pets.map((p) => p.id);

  const reminderWhere: Prisma.ReminderWhereInput = {
    petId: { in: petIds },
    ...(activeType ? { category: activeType } : {}),
  };
  const weekAgo = new Date(today.getTime() - 6 * 86_400_000);
  const weekAhead = new Date(today.getTime() + 7 * 86_400_000);

  const [open, appointments, completions, doneThisWeek, dueThisWeek] = await Promise.all([
    prisma.reminder.findMany({
      where: { ...reminderWhere, completedAt: null },
      orderBy: { dueAt: "asc" },
      include: { pet: { select: { name: true } } },
    }),
    activeType && activeType !== "APPOINTMENT"
      ? Promise.resolve([])
      : prisma.appointment.findMany({
          where: { petId: { in: petIds }, status: "UPCOMING", scheduledAt: { gte: now } },
          orderBy: { scheduledAt: "asc" },
          take: 20,
          include: { pet: { select: { name: true } } },
        }),
    prisma.reminderCompletion.findMany({
      where: { reminder: reminderWhere },
      orderBy: { completedAt: "desc" },
      take: 30,
      include: {
        reminder: {
          select: { title: true, category: true, repeat: true, repeatEvery: true, pet: { select: { name: true } } },
        },
        completedBy: { select: { name: true } },
      },
    }),
    prisma.reminderCompletion.count({
      where: { reminder: { petId: { in: pets.map((p) => p.id) } }, completedAt: { gte: weekAgo } },
    }),
    prisma.reminder.count({
      where: { petId: { in: pets.map((p) => p.id) }, completedAt: null, dueAt: { lt: weekAhead } },
    }),
  ]);

  const overdue = open.filter((r) => r.dueAt < today);
  const upcomingOpen = open.filter((r) => r.dueAt >= today);
  const oldest = overdue[0];

  const href = (next: Partial<Search>) => {
    const merged = { tab: tab === "upcoming" ? undefined : tab, pet: activePet?.id, type: activeType, ...next };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/reminders${qs ? `?${qs}` : ""}`;
  };
  const chip = (selected: boolean) =>
    `flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${
      selected
        ? "border-sky bg-[#eef3fb] text-[#2a559e]"
        : "border-transparent bg-[#ede4d0] text-ink hover:bg-[#e6dcc4]"
    }`;

  // Upcoming entries merge reminders and appointments, grouped by day.
  type Entry =
    | { kind: "reminder"; at: Date; reminder: (typeof open)[number] }
    | { kind: "appointment"; at: Date; appointment: (typeof appointments)[number] };
  const entries: Entry[] = [
    ...(tab === "overdue" ? overdue : tab === "all" ? open : upcomingOpen).map(
      (reminder): Entry => ({ kind: "reminder", at: reminder.dueAt, reminder }),
    ),
    ...(tab === "overdue"
      ? []
      : appointments.map((appointment): Entry => ({ kind: "appointment", at: appointment.scheduledAt, appointment }))),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  const groups: { heading: string; items: Entry[] }[] = [];
  for (const entry of entries) {
    const heading = entry.at < today && tab !== "upcoming" ? "Earlier" : dayHeading(entry.at, now);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(entry);
    else groups.push({ heading, items: [entry] });
  }

  const showOpen = tab !== "done";
  const showDone = tab === "done" || tab === "all";
  const totalWeek = doneThisWeek + dueThisWeek;

  return (
    <OwnerPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[40px] leading-[44px] text-forest">Reminders</h1>
        {pets.length > 0 ? (
          <StickerLink href={`/reminders/new${activePet ? `?pet=${activePet.id}` : ""}`} rotate={-3}>
            <Icon name="plus" size={18} />
            Create reminder
          </StickerLink>
        ) : null}
      </div>

      {pets.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8">
          <p className="text-[15px] text-muted">Add an animal to start setting reminders.</p>
          <Link href="/pets/new" className="text-sm font-semibold text-sky">
            + Add an animal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-5">
            <nav aria-label="Reminder views" className="flex gap-1 overflow-x-auto border-b border-line">
              {TABS.map((t) => {
                const count = t.key === "upcoming" ? upcomingOpen.length : t.key === "overdue" ? overdue.length : null;
                return (
                  <Link
                    key={t.key}
                    href={href({ tab: t.key === "upcoming" ? undefined : t.key })}
                    aria-current={t.key === tab ? "page" : undefined}
                    className={`-mb-px flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium ${
                      t.key === tab ? "border-sky text-[#2a559e]" : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {t.label}
                    {count ? (
                      <span className="rounded-full bg-[#eef0f3] px-1.5 text-xs">{count}</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {oldest && tab !== "done" ? (
              <div className="flex items-start gap-3 rounded-xl border border-[#f0d58a] bg-[#fff6dc] p-4">
                <Icon name="circle-alert" size={18} className="mt-0.5 shrink-0 text-[#8a5a00]" />
                <p className="text-sm">
                  <span className="font-semibold">
                    {oldest.pet.name}&apos;s {oldest.title.toLowerCase()} was due {fmtDay(oldest.dueAt)}
                  </span>
                  <br />
                  <span className="text-muted">Mark it done if it&apos;s been given, or reschedule it.</span>
                </p>
              </div>
            ) : null}

            {showOpen && groups.length === 0 && !(showDone && completions.length > 0) ? (
              <p className="rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8 text-[15px] text-muted">
                {tab === "overdue" ? "Nothing overdue." : "Nothing scheduled. Create a reminder to get started."}
              </p>
            ) : null}

            {showOpen
              ? groups.map((group) => (
                  <section key={group.heading} className="flex flex-col gap-3">
                    <h2 className="text-[13px] font-semibold text-muted">{group.heading}</h2>
                    <ul className="flex flex-col gap-3">
                      {group.items.map((entry) =>
                        entry.kind === "reminder" ? (
                          <ReminderCard key={entry.reminder.id} reminder={entry.reminder} petName={entry.reminder.pet.name} />
                        ) : (
                          <AppointmentTile
                            key={entry.appointment.id}
                            appointment={entry.appointment}
                            petName={entry.appointment.pet.name}
                          />
                        ),
                      )}
                    </ul>
                  </section>
                ))
              : null}

            {showDone ? (
              <section className="flex flex-col gap-3">
                {tab === "all" && completions.length > 0 ? (
                  <h2 className="text-[13px] font-semibold text-muted">Done recently</h2>
                ) : null}
                {completions.length === 0 && tab === "done" ? (
                  <p className="rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8 text-[15px] text-muted">
                    Completed reminders will show up here.
                  </p>
                ) : null}
                <ul className="flex flex-col gap-3">
                  {completions.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f4ec] text-[#0f6b47]">
                        <Icon name={CATEGORY_ICON[c.reminder.category]} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-muted line-through">
                          {c.reminder.title}
                        </p>
                        <p className="text-[13px] text-muted">
                          {c.reminder.pet.name} · Done {fmtDay(c.completedAt)}, {fmtTime(c.completedAt)}
                          {c.completedBy ? ` by ${c.completedBy.name}` : ""}
                          {c.reminder.repeat !== "NONE"
                            ? ` · ${repeatLabel(c.reminder.repeat, c.reminder.repeatEvery)}`
                            : ""}
                        </p>
                      </div>
                      <span className="flex h-6 items-center gap-1 rounded-md bg-[#e6f4ec] px-2 text-xs font-semibold text-[#0f6b47]">
                        <Icon name="circle-check" size={12} />
                        Done
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="flex flex-col gap-5">
            <div className="rounded-3xl bg-forest px-5 py-5 text-white">
              <p className="font-display text-[34px] leading-9 text-[#ffe48a]">
                {doneThisWeek} of {totalWeek}
              </p>
              <p className="text-sm">
                {totalWeek === 0 ? "Nothing due this week." : "done this week. Keep it up."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Animal</p>
              <div className="flex flex-wrap gap-2">
                <Link href={href({ pet: undefined })} className={chip(!activePet)}>
                  All
                </Link>
                {pets.map((p) => (
                  <Link key={p.id} href={href({ pet: p.id })} className={chip(activePet?.id === p.id)}>
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Type</p>
              <div className="flex flex-wrap gap-2">
                <Link href={href({ type: undefined })} className={chip(!activeType)}>
                  All
                </Link>
                {REMINDER_TYPES.map((t) => (
                  <Link key={t} href={href({ type: t })} className={chip(activeType === t)}>
                    {CATEGORY_LABEL[t]}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </OwnerPage>
  );
}
