import Link from "next/link";
import Icon from "@/app/components/app-icon";
import { fmtTime } from "@/app/lib/care";

/** A calendar-tile card for an upcoming appointment, shown inside reminder lists. */
export default function AppointmentTile({
  appointment,
  petName,
}: {
  appointment: {
    id: string;
    petId: string;
    title: string;
    scheduledAt: Date;
    clinicName: string | null;
  };
  petName: string;
}) {
  const d = appointment.scheduledAt;
  return (
    <li>
      <Link
        href={`/pets/${appointment.petId}/appointments`}
        className="flex items-center gap-4 rounded-xl border border-line bg-white p-3.5 hover:bg-[#fbfcfd]"
      >
        <span className="flex w-[52px] shrink-0 flex-col overflow-hidden rounded-lg border border-line text-center">
          <span className="bg-sky py-0.5 text-[11px] font-semibold text-white">
            {d.toLocaleDateString("en-GB", { month: "short" })}
          </span>
          <span className="text-[20px] font-semibold leading-6">{d.getDate()}</span>
          <span className="pb-0.5 text-[10px] text-muted">
            {d.toLocaleDateString("en-GB", { weekday: "short" })}
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold">{appointment.title}</span>
          <span className="text-[13px] text-muted">{petName}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="clock" size={13} />
            {fmtTime(d)}
            {appointment.clinicName ? (
              <>
                <Icon name="map-pin" size={13} className="ml-2" />
                <span className="truncate">{appointment.clinicName}</span>
              </>
            ) : null}
          </span>
        </span>
        <span className="flex h-6 shrink-0 items-center rounded-md bg-[#eef0f3] px-2 text-xs font-semibold text-muted">
          Appointment
        </span>
      </Link>
    </li>
  );
}
