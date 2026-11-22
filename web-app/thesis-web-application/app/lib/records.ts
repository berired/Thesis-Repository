import type { Prisma, RecordType } from "../generated/prisma/client";

/**
 * Health-record form rules, shared by the owner form (Phase 2) and the public
 * vet form (Phase 4) so the two cannot drift apart.
 */

export const RECORD_TYPE_OPTIONS: readonly (readonly [RecordType, string])[] = [
  ["VACCINATION", "Vaccine"],
  ["MEDICATION", "Medication"],
  ["VET_VISIT", "Check-up"],
  ["LAB_RESULT", "Lab"],
  ["WEIGHT", "Weight"],
  ["OTHER", "Other"],
];

const RECORD_TYPES = RECORD_TYPE_OPTIONS.map(([value]) => value);

export type RecordFields = {
  type: RecordType;
  title: string;
  recordDate: Date;
  weightKg: number | null;
  clinic: string | null;
  notes: string | null;
  dose: string | null;
  batchNumber: string | null;
  endDate: Date | null;
  nextDueDate: Date | null;
};

export type ParsedRecord = { ok: true; data: RecordFields } | { ok: false; error: string };

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
const optional = (fd: FormData, key: string) => text(fd, key) || null;

function parseDate(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Records are history: today or earlier. A day of slack covers time zones. */
export function isFutureDate(date: Date) {
  return date > new Date(Date.now() + 86_400_000);
}

/** Validates the record date alone (the one field owners may change on a vet record). */
export function parseRecordDate(
  fd: FormData,
): { ok: true; date: Date } | { ok: false; error: string } {
  const date = parseDate(text(fd, "recordDate"));
  if (!date) return { ok: false, error: "Enter a valid date." };
  if (isFutureDate(date)) return { ok: false, error: "Records can't be dated in the future." };
  return { ok: true, date };
}

export function parseRecordFields(fd: FormData): ParsedRecord {
  const type = text(fd, "type") as RecordType;
  if (!RECORD_TYPES.includes(type)) return { ok: false, error: "Choose a record type." };

  const date = parseRecordDate(fd);
  if (!date.ok) return date;

  let title = text(fd, "title");
  let weightKg: number | null = null;
  if (type === "WEIGHT") {
    weightKg = Number(text(fd, "weightKg"));
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 2000) {
      return { ok: false, error: "Enter a weight in kg." };
    }
    title = `${weightKg} kg`;
  } else if (!title) {
    return { ok: false, error: "Give the record a name." };
  }

  // Only the fields that belong to this type are kept; the rest are ignored.
  const medication = type === "MEDICATION";
  const vaccination = type === "VACCINATION";

  let endDate: Date | null = null;
  if (medication && text(fd, "endDate")) {
    endDate = parseDate(text(fd, "endDate"));
    if (!endDate) return { ok: false, error: "Enter a valid end date." };
    if (endDate < date.date) {
      return { ok: false, error: "The end date can't be before the start date." };
    }
  }
  let nextDueDate: Date | null = null;
  if (vaccination && text(fd, "nextDueDate")) {
    nextDueDate = parseDate(text(fd, "nextDueDate"));
    if (!nextDueDate) return { ok: false, error: "Enter a valid next dose date." };
    if (nextDueDate < date.date) {
      return { ok: false, error: "The next dose can't be before the date given." };
    }
  }

  return {
    ok: true,
    data: {
      type,
      title: title.slice(0, 120),
      recordDate: date.date,
      weightKg,
      clinic: optional(fd, "clinic")?.slice(0, 120) ?? null,
      notes: optional(fd, "notes")?.slice(0, 1000) ?? null,
      dose: medication ? (optional(fd, "dose")?.slice(0, 120) ?? null) : null,
      batchNumber: vaccination ? (optional(fd, "batchNumber")?.slice(0, 60) ?? null) : null,
      endDate,
      nextDueDate,
    },
  };
}

/** The pet's current weight follows its newest (non-voided) weight record. */
export async function syncPetWeight(tx: Prisma.TransactionClient, petId: string) {
  const latest = await tx.healthRecord.findFirst({
    where: { petId, type: "WEIGHT", voidedAt: null },
    orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }],
    select: { weightKg: true },
  });
  if (latest?.weightKg != null) {
    await tx.pet.update({ where: { id: petId }, data: { weightKg: latest.weightKg } });
  }
}
