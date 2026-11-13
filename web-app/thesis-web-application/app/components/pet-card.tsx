import Link from "next/link";
import Icon from "@/app/components/icon";
import { PetAvatar, SpeciesBadge } from "@/app/components/pet-avatar";
import { formatAge } from "@/app/lib/pets";
import { CATEGORY_ICON, fmtDay, reminderState } from "@/app/lib/care";
import type { IconName } from "@/app/components/icon";
import type { ReminderCategory } from "@/app/generated/prisma/client";

export type PetCardData = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: Date;
  birthDateApproximate: boolean;
  reminders: { title: string; dueAt: Date; category: ReminderCategory }[];
  appointments: { title: string; scheduledAt: Date }[];
};

type Next = { icon: IconName; title: string; urgent: boolean; when: string; at: Date };

/** The soonest of the pet's next reminder and next visit. */
export function nextThing(pet: PetCardData, now = new Date()): Next | null {
  const reminder = pet.reminders[0];
  const appt = pet.appointments[0];
  const isToday = (d: Date) => d.toDateString() === now.toDateString();

  if (reminder && (!appt || reminder.dueAt <= appt.scheduledAt)) {
    const overdue = reminderState(reminder.dueAt, now) === "overdue";
    return {
      icon: CATEGORY_ICON[reminder.category],
      title: reminder.title,
      urgent: overdue,
      when: overdue ? "Overdue" : isToday(reminder.dueAt) ? "Today" : fmtDay(reminder.dueAt),
      at: reminder.dueAt,
    };
  }
  if (appt) {
    return {
      icon: "stethoscope",
      title: appt.title,
      urgent: false,
      when: isToday(appt.scheduledAt) ? "Today" : fmtDay(appt.scheduledAt),
      at: appt.scheduledAt,
    };
  }
  return null;
}

export default function PetCard({ pet, now = new Date() }: { pet: PetCardData; now?: Date }) {
  const next = nextThing(pet, now);
  return (
    <Link
      href={`/pets/${pet.id}`}
      className="flex h-full flex-col gap-4 rounded-xl border border-line bg-white p-5 hover:border-forest"
    >
      <span className="flex items-center gap-3.5">
        <PetAvatar name={pet.name} species={pet.species} size={56} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-lg font-semibold leading-[23.4px]">{pet.name}</span>
          <span className="truncate text-[13px] leading-[19.5px] text-muted">
            {pet.breed ? `${pet.breed} · ` : ""}
            {formatAge(pet.birthDate, pet.birthDateApproximate)}
          </span>
        </span>
        <SpeciesBadge species={pet.species} />
      </span>
      <span className="flex items-center gap-2 rounded-lg bg-[#f6f8fa] px-3 py-2.5 text-[13px]">
        {next ? (
          <>
            <Icon name={next.icon} size={14} className="shrink-0 text-sky" />
            <span className="flex-1 truncate">{next.title}</span>
            <span className={next.urgent ? "text-[#b42318]" : "text-muted"}>{next.when}</span>
          </>
        ) : (
          <span className="text-muted">Nothing scheduled</span>
        )}
      </span>
    </Link>
  );
}
