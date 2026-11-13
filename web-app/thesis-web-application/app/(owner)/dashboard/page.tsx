import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import OwnerPage from "@/app/components/owner-page";
import Icon from "@/app/components/icon";
import ReminderCard from "@/app/components/reminder-card";
import { PetAvatar } from "@/app/components/pet-avatar";
import PetCard from "@/app/components/pet-card";
import {
  APPOINTMENT_CHIP,
  APPOINTMENT_ICON,
  APPOINTMENT_LABEL,
  endOfToday,
  fmtTime,
  startOfToday,
  whenPhrase,
} from "@/app/lib/care";
import { restorePet } from "@/app/(owner)/actions";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const STEPS = [
  {
    n: 1,
    title: "Add an animal",
    body: "Name, species, birthday and a photo.",
    color: "bg-butter",
  },
  {
    n: 2,
    title: "Log their health",
    body: "Add past vaccines and vet visits.",
    color: "bg-blush",
  },
  {
    n: 3,
    title: "Set a reminder",
    body: "Feeding, meds or deworming that repeats.",
    color: "bg-powder",
  },
];

function AddAnimalButton() {
  return (
    <Link
      href="/pets/new"
      className="inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3.5 pb-[9px] pt-[7px] font-display text-xl leading-5 text-ink shadow-[3px_3px_0_var(--color-ink)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/plus.svg" alt="" width={18} height={18} />
      Add animal
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const firstName = session.user.name.split(/\s+/)[0];

  const now = new Date();
  const openStatuses = ["AWAITING_CLINIC", "CONFIRMED"] as const;
  const activePets = { ownerId: session.user.id, archivedAt: null };

  const [pets, archived, care, careCount, visits] = await Promise.all([
    prisma.pet.findMany({
      where: activePets,
      orderBy: { createdAt: "desc" },
      include: {
        reminders: { where: { completedAt: null }, orderBy: { dueAt: "asc" }, take: 1 },
        appointments: {
          where: { status: { in: [...openStatuses] }, scheduledAt: { gte: now } },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
      },
    }),
    prisma.pet.findMany({
      where: { ownerId: session.user.id, archivedAt: { not: null } },
      orderBy: { archivedAt: "desc" },
      select: { id: true, name: true, species: true },
    }),
    prisma.reminder.findMany({
      where: { completedAt: null, dueAt: { lt: endOfToday(now) }, pet: activePets },
      orderBy: { dueAt: "asc" },
      take: 5,
      include: { pet: { select: { name: true } } },
    }),
    prisma.reminder.count({
      where: { completedAt: null, dueAt: { lt: endOfToday(now) }, pet: activePets },
    }),
    prisma.appointment.findMany({
      where: {
        status: { in: [...openStatuses] },
        scheduledAt: { gte: now },
        pet: activePets,
      },
      orderBy: { scheduledAt: "asc" },
      take: 2,
      include: { pet: { select: { name: true } } },
    }),
  ]);

  if (pets.length === 0 && archived.length === 0) {
    return (
      <OwnerPage>
        <section className="flex items-center gap-12 rounded-3xl bg-forest px-12 py-12 text-white">
          <div className="flex min-w-0 max-w-[560px] flex-1 flex-col items-start">
            <p className="text-[15px] font-medium leading-[22.5px]">
              Hi {firstName}, your account is ready.
            </p>
            <h1 className="mt-4 font-display text-6xl leading-[0.805] text-butter md:text-[96px]">
              <span className="block">Let&apos;s add</span>
              <span className="block">your first</span>
              <span className="block">animal</span>
            </h1>
            <p className="mt-5 max-w-[440px] text-[17px] leading-[25.5px]">
              Dog, cat, hen, lizard or goldfish, they all get a profile, health
              records and reminders.
            </p>
            <div className="mt-6 pl-1">
              <AddAnimalButton />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="ml-auto hidden w-[340px] shrink-0 justify-center lg:flex"
          >
            <div className="relative w-[290px] rotate-5 rounded-lg bg-white px-3.5 pb-[18px] pt-3.5 shadow-[6px_6px_0_var(--color-butter)]">
              <div className="absolute -top-[18px] left-1/2 h-7 w-[100px] -translate-x-1/2 -rotate-3 bg-blush" />
              <div className="relative flex h-60 items-center justify-center bg-[rgba(127,127,127,0.08)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/image-placeholder.svg"
                  alt=""
                  width={28}
                  height={28}
                />
                <div className="pointer-events-none absolute inset-0 border border-dashed border-ink opacity-35" />
              </div>
              <p className="mt-[11px] text-base font-semibold leading-6 text-ink">
                caption here
              </p>
            </div>
          </div>
        </section>

        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="flex items-start gap-3.5 rounded-2xl border border-line bg-white p-[22px]"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink text-[15px] font-semibold text-ink ${step.color}`}
              >
                {step.n}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold leading-6">{step.title}</p>
                <p className="text-[13px] leading-[19.5px] text-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </OwnerPage>
    );
  }

  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const overdueTotal = await prisma.reminder.count({
    where: { completedAt: null, dueAt: { lt: startOfToday(now) }, pet: activePets },
  });

  // The banner's last clause: the soonest visit, if there is one.
  const soonest = visits[0];
  const summary = [
    careCount > 0
      ? `${careCount} ${careCount === 1 ? "thing" : "things"} to do today`
      : "Nothing to do today",
    overdueTotal > 0 ? `${overdueTotal} overdue` : null,
    soonest
      ? `${soonest.pet.name}'s ${soonest.title.toLowerCase()} is ${whenPhrase(soonest.scheduledAt, now)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <OwnerPage>
      <section className="flex items-center gap-6 rounded-3xl bg-forest px-8 py-7">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm font-medium leading-[21px] text-white">{dateLabel}</p>
          <h1 className="font-display text-5xl leading-none text-butter md:text-[56px]">
            {greeting(now.getHours())}, {firstName}
          </h1>
          <p className="text-base leading-6 text-white">{summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-[9px]">
          <span
            aria-disabled="true"
            title="Coming soon"
            className="flex h-10 cursor-default items-center gap-2 rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold text-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/map-pin.svg" alt="" width={18} height={18} />
            Find a vet
          </span>
          <AddAnimalButton />
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[30px] leading-[33px] text-forest">
              Today&apos;s care
            </h2>
            <span className="pb-1 text-[13px] text-muted">{careCount} to do</span>
          </div>
          {care.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
              All caught up. Add reminders from an animal&apos;s page.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {care.map((r) => (
                <ReminderCard key={r.id} reminder={r} petName={r.pet.name} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[30px] leading-[33px] text-forest">Vet visits</h2>
          {visits.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
              No visits booked. Book one from an animal&apos;s Appointments tab.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visits.map((v) => (
                <li key={v.id} className="flex gap-4 rounded-xl border border-line bg-white p-4">
                  <div className="flex w-[58px] shrink-0 flex-col self-start overflow-clip rounded-lg border border-line bg-white text-center">
                    <span className="bg-sky py-0.5 text-xs font-semibold text-white">
                      {v.scheduledAt.toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                    <span className="text-[26px] font-semibold leading-8 text-ink">
                      {v.scheduledAt.getDate()}
                    </span>
                    <span className="pb-1 text-[11px] text-muted">
                      {v.scheduledAt.toLocaleDateString("en-GB", { weekday: "short" })}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold leading-6">{v.title}</p>
                      <span
                        className={`flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${APPOINTMENT_CHIP[v.status]}`}
                      >
                        <Icon name={APPOINTMENT_ICON[v.status]} size={12} />
                        {APPOINTMENT_LABEL[v.status]}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-[13px] text-muted">
                      <Icon name="clock" size={14} />
                      {fmtTime(v.scheduledAt)}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-muted">
                      <Icon name="map-pin" size={14} />
                      {v.clinicName}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-muted">
                      <Icon name="paw-print" size={14} />
                      {v.pet.name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[30px] leading-[33px] text-forest">Your animals</h2>
        {pets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
            All your animals are archived. Restore one below, or add a new animal.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pets.map((pet) => (
              <li key={pet.id}>
                <PetCard pet={pet} now={now} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold leading-6">Archived</h2>
          <ul className="flex flex-col gap-2">
            {archived.map((pet) => (
              <li
                key={pet.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
              >
                <PetAvatar name={pet.name} species={pet.species} size={36} />
                <Link href={`/pets/${pet.id}`} className="flex-1 font-medium hover:underline">
                  {pet.name}
                </Link>
                <form action={restorePet.bind(null, pet.id)}>
                  <button type="submit" className="text-sm font-semibold text-sky underline">
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </OwnerPage>
  );
}
