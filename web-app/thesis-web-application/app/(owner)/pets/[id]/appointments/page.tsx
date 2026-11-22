import { prisma } from "@/app/lib/prisma";
import Icon from "@/app/components/app-icon";
import { getOwnedPet } from "@/app/lib/pet-data";
import {
  APPOINTMENT_CHIP,
  APPOINTMENT_ICON,
  APPOINTMENT_LABEL,
  fmtTime,
} from "@/app/lib/care";
import { cancelAppointment } from "@/app/(owner)/actions";
import type { AppointmentStatus } from "@/app/generated/prisma/client";
import PetShell from "../pet-shell";

type Appt = {
  id: string;
  title: string;
  scheduledAt: Date;
  clinicName: string | null;
  status: AppointmentStatus;
};

function CalendarTile({ date, muted }: { date: Date; muted?: boolean }) {
  return (
    <div
      className={`flex w-[58px] shrink-0 flex-col overflow-clip rounded-lg border border-line bg-white text-center ${
        muted ? "opacity-60" : ""
      }`}
    >
      <span className="bg-sky py-0.5 text-xs font-semibold text-white">
        {date.toLocaleDateString("en-GB", { month: "short" })}
      </span>
      <span className="text-[26px] font-semibold leading-8 text-ink">
        {date.getDate()}
      </span>
      <span className="pb-1 text-[11px] text-muted">
        {date.toLocaleDateString("en-GB", { weekday: "short" })}
      </span>
    </div>
  );
}

function ApptCard({
  appt,
  status,
  cancellable,
}: {
  appt: Appt;
  status: AppointmentStatus;
  cancellable?: boolean;
}) {
  const cancelled = status === "CANCELLED";
  return (
    <li className="flex gap-4 rounded-xl border border-line bg-white p-4">
      <CalendarTile date={appt.scheduledAt} muted={cancelled} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-base font-semibold leading-6 ${
              cancelled ? "text-muted line-through" : "text-ink"
            }`}
          >
            {appt.title}
          </p>
          <span
            className={`flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${APPOINTMENT_CHIP[status]}`}
          >
            <Icon name={APPOINTMENT_ICON[status]} size={12} />
            {APPOINTMENT_LABEL[status]}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          <Icon name="clock" size={14} />
          {fmtTime(appt.scheduledAt)}
        </p>
        {appt.clinicName ? (
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="map-pin" size={14} />
            {appt.clinicName}
          </p>
        ) : null}
        {cancellable ? (
          <form action={cancelAppointment.bind(null, appt.id)} className="mt-1">
            <button type="submit" className="text-[13px] font-medium text-[#b42318] underline">
              Cancel appointment
            </button>
          </form>
        ) : null}
      </div>
    </li>
  );
}

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getOwnedPet(id);
  const now = new Date();

  const all = await prisma.appointment.findMany({
    where: { petId: pet.id },
    orderBy: { scheduledAt: "asc" },
  });

  const isOpen = (a: Appt) => a.status === "UPCOMING";
  const upcoming = all.filter((a) => isOpen(a) && a.scheduledAt >= now);
  const past = all
    .filter((a) => !(isOpen(a) && a.scheduledAt >= now))
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  // The owner keeps this calendar, so an upcoming visit whose date has passed counts as done.
  const pastStatus = (a: Appt): AppointmentStatus => (a.status === "UPCOMING" ? "DONE" : a.status);

  return (
    <PetShell pet={pet} active="appointments" crumb="Appointments">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[26px] leading-7 text-forest">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
              No upcoming visits for {pet.name}.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((a) => (
                <ApptCard key={a.id} appt={a} status={a.status} cancellable />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[26px] leading-7 text-forest">Past visits</h2>
          {past.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
              Past visits will show up here.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {past.map((a) => (
                <ApptCard key={a.id} appt={a} status={pastStatus(a)} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PetShell>
  );
}
