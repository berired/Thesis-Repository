import type {
  AppointmentStatus,
  RecordType,
  ReminderCategory,
  ReminderRepeat,
} from "../generated/prisma/client";
import type { IconName } from "@/app/components/app-icon";

/* Dates are read and written in the server's local time zone. */

export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function endOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

export const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const fmtFull = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export type ReminderState = "overdue" | "today" | "upcoming";

/** Overdue = before today. Due today = today and the time has passed. Upcoming = later. */
export function reminderState(dueAt: Date, now = new Date()): ReminderState {
  if (dueAt < startOfToday(now)) return "overdue";
  if (dueAt <= now) return "today";
  return "upcoming";
}

export const STATE_LABEL: Record<ReminderState, string> = {
  overdue: "Overdue",
  today: "Due today",
  upcoming: "Upcoming",
};

export const STATE_CHIP: Record<ReminderState, string> = {
  overdue: "bg-[#fde8e6] text-[#b42318]",
  today: "bg-[#fff0cc] text-[#8a5a00]",
  upcoming: "bg-[#eef0f3] text-muted",
};

export const STATE_ICON: Record<ReminderState, IconName> = {
  overdue: "circle-alert",
  today: "clock",
  upcoming: "clock",
};

export const CATEGORY_ICON: Record<ReminderCategory, IconName> = {
  MEDICATION: "pill",
  VACCINE: "syringe",
  FEEDING: "utensils",
  GROOMING: "scissors",
  EXERCISE: "footprints",
  HABITAT: "house",
  APPOINTMENT: "calendar",
  OTHER: "bell",
};

export const CATEGORY_LABEL: Record<ReminderCategory, string> = {
  MEDICATION: "Medication",
  VACCINE: "Vaccine",
  FEEDING: "Feeding",
  GROOMING: "Grooming",
  EXERCISE: "Exercise",
  HABITAT: "Habitat",
  APPOINTMENT: "Appointment",
  OTHER: "Other",
};

export const REPEAT_UNIT: Record<Exclude<ReminderRepeat, "NONE">, [string, string]> = {
  DAILY: ["day", "days"],
  WEEKLY: ["week", "weeks"],
  MONTHLY: ["month", "months"],
  YEARLY: ["year", "years"],
};

export const REPEAT_LABEL: Record<ReminderRepeat, string> = {
  NONE: "Doesn't repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

/** "Daily", "Every 3 months", "Doesn't repeat". */
export function repeatLabel(repeat: ReminderRepeat, every: number) {
  if (repeat === "NONE") return REPEAT_LABEL.NONE;
  if (every <= 1) return REPEAT_LABEL[repeat];
  return `Every ${every} ${REPEAT_UNIT[repeat][1]}`;
}

/** One step forward from a due date. */
function step(from: Date, repeat: ReminderRepeat, every: number) {
  const next = new Date(from);
  if (repeat === "DAILY") next.setDate(next.getDate() + every);
  else if (repeat === "WEEKLY") next.setDate(next.getDate() + 7 * every);
  else if (repeat === "MONTHLY") next.setMonth(next.getMonth() + every);
  else next.setFullYear(next.getFullYear() + every);
  return next;
}

/**
 * The next due date after completing a repeating reminder, skipping past any missed ones.
 * Null when it doesn't repeat or the next date would fall after its end date.
 */
export function nextDue(
  dueAt: Date,
  repeat: ReminderRepeat,
  every = 1,
  endsAt: Date | null = null,
  now = new Date(),
) {
  if (repeat === "NONE") return null;
  let next = step(dueAt, repeat, every);
  while (next <= now) next = step(next, repeat, every);
  return endsAt && next > endsAt ? null : next;
}

/** The next few occurrences, for the form preview. */
export function upcomingDates(
  start: Date,
  repeat: ReminderRepeat,
  every: number,
  endsAt: Date | null,
  count: number,
) {
  const out: Date[] = [];
  if (repeat === "NONE") return out;
  let next = step(start, repeat, every);
  while (out.length < count && (!endsAt || next <= endsAt)) {
    out.push(next);
    next = step(next, repeat, every);
  }
  return out;
}

export const RECORD_LABEL: Record<RecordType, string> = {
  VACCINATION: "Vaccination",
  VET_VISIT: "Check-up",
  LAB_RESULT: "Lab result",
  MEDICATION: "Medication",
  WEIGHT: "Weight",
  OTHER: "Other",
};

export const RECORD_ICON: Record<RecordType, IconName> = {
  VACCINATION: "syringe",
  VET_VISIT: "stethoscope",
  LAB_RESULT: "flask-conical",
  MEDICATION: "pill",
  WEIGHT: "weight",
  OTHER: "file-text",
};

export const APPOINTMENT_LABEL: Record<AppointmentStatus, string> = {
  UPCOMING: "Upcoming",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const APPOINTMENT_CHIP: Record<AppointmentStatus, string> = {
  UPCOMING: "bg-[#fff0cc] text-[#8a5a00]",
  DONE: "bg-[#e6eefb] text-[#2a559e]",
  CANCELLED: "bg-[#eef0f3] text-muted",
};

export const APPOINTMENT_ICON: Record<AppointmentStatus, IconName> = {
  UPCOMING: "clock",
  DONE: "check",
  CANCELLED: "circle-x",
};

/** "3 yrs", "5 mos" style age used in chips. */
export function shortAge(birthDate: Date, approximate: boolean) {
  const now = new Date();
  let months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  if (now.getDate() < birthDate.getDate()) months -= 1;
  months = Math.max(months, 0);
  const years = Math.floor(months / 12);
  const text =
    years >= 1
      ? `${years} ${years === 1 ? "yr" : "yrs"}`
      : `${months} ${months === 1 ? "mo" : "mos"}`;
  return approximate ? `~${text}` : text;
}

/** Phrase for how far away a date is, for the home banner. */
export function whenPhrase(date: Date, now = new Date()) {
  const days = Math.round(
    (startOfToday(date).getTime() - startOfToday(now).getTime()) / 86_400_000,
  );
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 14) return "next week";
  return `on ${fmtDay(date)}`;
}
