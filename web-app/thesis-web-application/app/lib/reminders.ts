import { CATEGORY_LABEL, nextDue } from "./care";
import type {
  Prisma,
  RecordType,
  ReminderCategory,
  ReminderRepeat,
} from "../generated/prisma/client";

/**
 * Reminder rules shared by the reminder form, the completion action and the
 * medication dose reminders.
 */

export const REMINDER_TYPES = Object.keys(CATEGORY_LABEL) as ReminderCategory[];
const REPEATS: ReminderRepeat[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

export type ReminderFields = {
  title: string;
  category: ReminderCategory;
  dueAt: Date;
  repeat: ReminderRepeat;
  repeatEvery: number;
  endsAt: Date | null;
  remindDayBefore: boolean;
  place: string | null;
  addToRecords: boolean;
};

export type ParsedReminder = { ok: true; data: ReminderFields } | { ok: false; error: string };

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

function parseDate(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseReminderFields(fd: FormData): ParsedReminder {
  const title = text(fd, "title");
  const category = text(fd, "category") as ReminderCategory;
  const repeat = (text(fd, "repeat") || "NONE") as ReminderRepeat;
  const every = Math.floor(Number(text(fd, "repeatEvery") || "1"));
  const dueAt = parseDate(`${text(fd, "startDate")}T${text(fd, "startTime") || "09:00"}`);
  const endsAt = parseDate(text(fd, "endsAt") ? `${text(fd, "endsAt")}T23:59` : "");

  if (!title) return { ok: false, error: "Give the reminder a title." };
  if (title.length > 120) return { ok: false, error: "Keep the title under 120 characters." };
  if (!REMINDER_TYPES.includes(category)) return { ok: false, error: "Choose a type." };
  if (!REPEATS.includes(repeat)) return { ok: false, error: "Choose how often it repeats." };
  if (!dueAt) return { ok: false, error: "Choose a date and time." };
  if (repeat !== "NONE" && !(every >= 1 && every <= 365)) {
    return { ok: false, error: "Repeat every 1 to 365." };
  }
  if (text(fd, "endsAt") && !endsAt) return { ok: false, error: "Enter a valid end date." };
  if (endsAt && endsAt < dueAt) return { ok: false, error: "The end date is before the start." };

  const place = text(fd, "place").slice(0, 120) || null;
  return {
    ok: true,
    data: {
      title,
      category,
      dueAt,
      repeat,
      repeatEvery: repeat === "NONE" ? 1 : every,
      endsAt: repeat === "NONE" ? null : endsAt,
      remindDayBefore: fd.get("remindDayBefore") === "on",
      place: category === "APPOINTMENT" ? place : null,
      addToRecords: fd.get("addToRecords") === "on",
    },
  };
}

const RECORD_FOR: Partial<Record<ReminderCategory, RecordType>> = {
  MEDICATION: "MEDICATION",
  VACCINE: "VACCINATION",
  APPOINTMENT: "VET_VISIT",
};

type Completable = {
  id: string;
  petId: string;
  title: string;
  category: ReminderCategory;
  dueAt: Date;
  repeat: ReminderRepeat;
  repeatEvery: number;
  endsAt: Date | null;
  addToRecords: boolean;
  place: string | null;
};

/**
 * Logs the completion, then rolls a repeating reminder forward or closes it.
 * Optionally writes the matching health record.
 */
export async function completeReminderIn(
  tx: Prisma.TransactionClient,
  reminder: Completable,
  userId: string,
) {
  const now = new Date();
  await tx.reminderCompletion.create({
    data: { reminderId: reminder.id, completedById: userId, dueAt: reminder.dueAt },
  });
  const next = nextDue(reminder.dueAt, reminder.repeat, reminder.repeatEvery, reminder.endsAt, now);
  await tx.reminder.update({
    where: { id: reminder.id },
    data: next ? { dueAt: next } : { completedAt: now },
  });
  if (reminder.addToRecords) {
    await tx.healthRecord.create({
      data: {
        petId: reminder.petId,
        type: RECORD_FOR[reminder.category] ?? "OTHER",
        title: reminder.title,
        recordDate: now,
        clinic: reminder.place,
        source: "OWNER",
      },
    });
  }
}

/** "08:00" style times from repeated `doseTime` fields, de-duplicated and sorted. */
export function parseDoseTimes(fd: FormData) {
  const times = fd
    .getAll("doseTime")
    .filter((v): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v));
  return [...new Set(times)].sort().slice(0, 6);
}

/** Replaces a medication record's dose reminders with one daily reminder per dose time. */
export async function syncDoseReminders(
  tx: Prisma.TransactionClient,
  record: { id: string; petId: string; title: string; endDate: Date | null },
  userId: string,
  doseTimes: string[],
) {
  await tx.reminder.deleteMany({ where: { recordId: record.id } });
  if (doseTimes.length === 0 || !record.endDate) return;

  const now = new Date();
  const endsAt = new Date(record.endDate);
  endsAt.setHours(23, 59, 0, 0);
  for (const time of doseTimes) {
    const [h, m] = time.split(":").map(Number);
    const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (first <= now) first.setDate(first.getDate() + 1);
    if (first > endsAt) continue;
    await tx.reminder.create({
      data: {
        petId: record.petId,
        recordId: record.id,
        title: `${record.title} dose`,
        category: "MEDICATION",
        dueAt: first,
        repeat: "DAILY",
        repeatEvery: 1,
        endsAt,
        assigneeId: userId,
      },
    });
  }
}
