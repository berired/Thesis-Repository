import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import Icon from "@/app/components/app-icon";
import ReminderCard from "@/app/components/reminder-card";
import { getAccessiblePet } from "@/app/lib/pet-data";
import { requireUser } from "@/app/lib/session";
import { visibleReminders } from "@/app/lib/pet-access";
import { RECORD_ICON, fmtFull } from "@/app/lib/care";
import PetShell from "./pet-shell";

export default async function PetOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getAccessiblePet(id);
  const session = await requireUser();
  const isOwner = pet.role === "owner";

  const [reminders, records] = await Promise.all([
    prisma.reminder.findMany({
      where: { petId: pet.id, completedAt: null, AND: [visibleReminders(session.user.id)] },
      orderBy: { dueAt: "asc" },
      take: 3,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.healthRecord.findMany({
      where: { petId: pet.id, voidedAt: null },
      orderBy: { recordDate: "desc" },
      take: 3,
    }),
  ]);

  const details: [string, string | null][] = [
    [
      "Birthday",
      `${fmtFull(pet.birthDate)}${pet.birthDateApproximate ? " (estimated)" : ""}`,
    ],
    ["Weight", pet.weightKg !== null ? `${pet.weightKg} kg` : null],
    ["Colour", pet.color],
    ["Microchip", pet.microchip],
    ["Neutered", pet.neutered === null ? null : pet.neutered ? "Yes" : "No"],
    ["Allergies", pet.allergies],
  ];

  return (
    <PetShell pet={pet} active="overview">
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold leading-6">Details</h2>
          <dl className="flex flex-col gap-3">
            {details.map(([label, value]) => (
              <div key={label} className="flex gap-4 text-sm leading-[21px]">
                <dt className="w-[84px] shrink-0 text-muted">{label}</dt>
                <dd className="min-w-0 font-medium">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          {pet.medicalNotes ? (
            <p className="rounded-lg bg-cream px-3 py-2 text-[13px] leading-[19.5px] text-muted">
              {pet.medicalNotes}
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[26px] leading-7 text-forest">Next up</h2>
            {isOwner ? (
              <Link
                href={`/pets/${pet.id}/reminders/new`}
                className="text-sm font-semibold text-sky"
              >
                + Add reminder
              </Link>
            ) : null}
          </div>
          {reminders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
              {isOwner
                ? `Nothing scheduled for ${pet.name}. Add a reminder for feeding, meds or vaccines.`
                : "Nothing is assigned to you for " + pet.name + " right now."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {reminders.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  petName={pet.name}
                  canDelete={isOwner}
                  viewerId={session.user.id}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold leading-6">Recent records</h2>
            <Link
              href={`/pets/${pet.id}/records`}
              className="text-sm font-semibold text-sky"
            >
              See all
            </Link>
          </div>
          {records.length === 0 ? (
            <p className="text-sm text-muted">No records yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {records.map((record) => (
                <li key={record.id} className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-butter-soft text-butter-ink">
                    <Icon name={RECORD_ICON[record.type]} size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold leading-[22.5px]">
                      {record.title}
                    </p>
                    <p className="truncate text-[13px] leading-[19.5px] text-muted">
                      {fmtFull(record.recordDate)}
                      {record.clinic ? ` · ${record.clinic}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="flex items-center gap-3 rounded-xl border border-[#b9cdee] bg-[#e6eefb] px-4 py-3 text-sm text-ink">
        <Icon name="info" size={16} className="shrink-0 text-sky" />
        Pawket Book keeps your records organised — it doesn&apos;t diagnose. Talk to your
        vet about any symptoms.
      </p>
    </PetShell>
  );
}
