import type {
  AppointmentStatus,
  RecordType,
  ReminderCategory,
  ReminderRepeat,
} from "../generated/prisma/client";
import type { IconName } from "@/app/components/icon";

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
  CHECKUP: "stethoscope",
  CARE: "droplets",
  WALK: "footprints",
};

export const CATEGORY_LABEL: Record<ReminderCategory, string> = {
  MEDICATION: "Medication",
  VACCINE: "Vaccine",
  CHECKUP: "Check-up",
  CARE: "Care",
  WALK: "Walk",
};

export const REPEAT_LABEL: Record<ReminderRepeat, string> = {
  NONE: "Doesn't repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

/** The next due date after completing a repeating reminder, skipping past any missed ones. */
export function nextDue(dueAt: Date, repeat: ReminderRepeat, now = new Date()) {
  if (repeat === "NONE") return null;
  const next = new Date(dueAt);
  do {
    if (repeat === "DAILY") next.setDate(next.getDate() + 1);
    else if (repeat === "WEEKLY") next.setDate(next.getDate() + 7);
    else if (repeat === "MONTHLY") next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);
  } while (next <= now);
  return next;
}

export const RECORD_LABEL: Record<RecordType, string> = {
  VACCINE: "Vaccine",
  WEIGHT: "Weight",
  CHECKUP: "Check-up",
  MEDICATION: "Medication",
  LAB: "Lab",
};

export const RECORD_ICON: Record<RecordType, IconName> = {
  VACCINE: "syringe",
  WEIGHT: "weight",
  CHECKUP: "stethoscope",
  MEDICATION: "pill",
  LAB: "flask-conical",
};

export const APPOINTMENT_LABEL: Record<AppointmentStatus, string> = {
  AWAITING_CLINIC: "Awaiting clinic",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const APPOINTMENT_CHIP: Record<AppointmentStatus, string> = {
  AWAITING_CLINIC: "bg-[#fff0cc] text-[#8a5a00]",
  CONFIRMED: "bg-[#ddf1e8] text-[#0f6b47]",
  COMPLETED: "bg-[#e6eefb] text-[#2a559e]",
  CANCELLED: "bg-[#eef0f3] text-muted",
};

export const APPOINTMENT_ICON: Record<AppointmentStatus, IconName> = {
  AWAITING_CLINIC: "clock",
  CONFIRMED: "circle-check",
  COMPLETED: "check",
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
