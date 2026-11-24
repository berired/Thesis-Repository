import { dayOfMonth, monthShort, weekdayShort } from "@/app/lib/time";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import Icon from "@/app/components/app-icon";
import { getAccessiblePet } from "@/app/lib/pet-data";
import {
  APPOINTMENT_CHIP,
  APPOINTMENT_ICON,
  APPOINTMENT_LABEL,
  fmtFull,
  fmtTime,
} from "@/app/lib/care";
import { cancelAppointment, completeAppointment } from "@/app/(owner)/actions";
import type { AppointmentStatus } from "@/app/generated/prisma/client";
import PetShell from "../pet-shell";

type Appt = {
  id: string;
  title: string;
  scheduledAt: Date;
  clinicName: string | null;
  status: AppointmentStatus;
};

const TABS: { key: AppointmentStatus; label: string; param: string }[] = [
  { key: "UPCOMING", label: "Upcoming", param: "upcoming" },
  { key: "DONE", label: "Done", param: "done" },
  { key: "CANCELLED", label: "Cancelled", param: "cancelled" },
];

function CalendarTile({ date, muted }: { date: Date; muted?: boolean }) {
  return (
    <div
      className={`flex w-[58px] shrink-0 flex-col overflow-clip rounded-lg border border-line bg-white text-center ${
        muted ? "opacity-60" : ""
      }`}
    >
      <span className="bg-sky py-0.5 text-xs font-semibold text-white">
        {monthShort(date)}
      </span>
      <span className="text-[26px] font-semibold leading-8 text-ink">{dayOfMonth(date)}</span>
      <span className="pb-1 text-[11px] text-muted">
        {weekdayShort(date)}
      </span>
    </div>
  );
}

function ApptCard({ appt, now, canEdit }: { appt: Appt; now: Date; canEdit: boolean }) {
  const cancelled = appt.status === "CANCELLED";
  const open = appt.status === "UPCOMING";
  const passed = open && appt.scheduledAt < now;
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
            className={`flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${APPOINTMENT_CHIP[appt.status]}`}
          >
            <Icon name={APPOINTMENT_ICON[appt.status]} size={12} />
            {APPOINTMENT_LABEL[appt.status]}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          <Icon name="clock" size={14} />
          {passed ? `${fmtFull(appt.scheduledAt)}, ` : ""}
          {fmtTime(appt.scheduledAt)}
        </p>
        {appt.clinicName ? (
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="map-pin" size={14} />
            {appt.clinicName}
          </p>
        ) : null}
        {open && canEdit ? (
          <div className="mt-1 flex flex-wrap items-center gap-4">
            {passed ? (
              <form action={completeAppointment.bind(null, appt.id)}>
                <button type="submit" className="text-[13px] font-semibold text-[#0f6b47] underline">
                  Mark as done
                </button>
              </form>
            ) : null}
            <form action={cancelAppointment.bind(null, appt.id)}>
              <button type="submit" className="text-[13px] font-medium text-[#b42318] underline">
                Cancel appointment
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default async function AppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status: statusParam } = await searchParams;
  const pet = await getAccessiblePet(id);
  const now = new Date();
  const tab = TABS.find((t) => t.param === statusParam) ?? TABS[0];

  const [list, counts] = await Promise.all([
    prisma.appointment.findMany({
      where: { petId: pet.id, status: tab.key },
      orderBy: { scheduledAt: tab.key === "UPCOMING" ? "asc" : "desc" },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { petId: pet.id },
      _count: { _all: true },
    }),
  ]);
  const countOf = (status: AppointmentStatus) =>
    counts.find((c) => c.status === status)?._count._all ?? 0;

  return (
    <PetShell pet={pet} active="appointments" crumb="Appointments">
      <nav aria-label="Appointment status" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "UPCOMING" ? `/pets/${pet.id}/appointments` : `/pets/${pet.id}/appointments?status=${t.param}`}
            aria-current={t.key === tab.key ? "page" : undefined}
            className={`-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium ${
              t.key === tab.key
                ? "border-sky text-[#2a559e]"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {countOf(t.key) > 0 ? (
              <span className="rounded-full bg-[#eef0f3] px-1.5 text-xs">{countOf(t.key)}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <p className="max-w-[560px] rounded-xl border border-dashed border-[#c3c9d1] p-5 text-sm text-muted">
          {tab.key === "UPCOMING"
            ? `No upcoming visits for ${pet.name}.`
            : tab.key === "DONE"
              ? "Visits you mark as done will show up here."
              : "Cancelled visits will show up here."}
        </p>
      ) : (
        <ul className="flex max-w-[560px] flex-col gap-3">
          {list.map((a) => (
            <ApptCard key={a.id} appt={a} now={now} canEdit={pet.role === "owner"} />
          ))}
        </ul>
      )}
    </PetShell>
  );
}
