import type { RecordFields } from "./records";
import { RECORD_LABEL } from "./care";
import { fmtFull } from "./time";

/** One field that changed in a saved edit. Values are stored as the text people saw. */
export type FieldChange = { field: string; from: string | null; to: string | null };

type Snapshot = Pick<
  RecordFields,
  | "type"
  | "title"
  | "recordDate"
  | "weightKg"
  | "clinic"
  | "notes"
  | "dose"
  | "batchNumber"
  | "endDate"
  | "nextDueDate"
>;

const dateText = (d: Date | null) => (d ? fmtFull(d) : null);

/** The values worth comparing, in the order they appear in the history. */
function view(r: Snapshot): [string, string | null][] {
  return [
    ["Type", RECORD_LABEL[r.type]],
    ["Name", r.type === "WEIGHT" ? null : r.title],
    ["Date", dateText(r.recordDate)],
    ["Weight", r.weightKg !== null ? `${r.weightKg} kg` : null],
    ["Clinic", r.clinic],
    ["Dose", r.dose],
    ["End date", dateText(r.endDate)],
    ["Batch / lot no.", r.batchNumber],
    ["Next dose due", dateText(r.nextDueDate)],
    ["Notes", r.notes],
  ];
}

/** Every field that differs between two versions of a record, with its old and new value. */
export function diffRecord(before: Snapshot, after: Snapshot): FieldChange[] {
  const old = view(before);
  const next = view(after);
  const changes: FieldChange[] = [];
  next.forEach(([field, to], i) => {
    const from = old[i][1];
    if (from !== to) changes.push({ field, from, to });
  });
  return changes;
}

/** Reads a stored `changes` value back, ignoring anything that isn't the expected shape. */
export function readChanges(value: unknown): FieldChange[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((c) => {
    if (!c || typeof c !== "object" || typeof c.field !== "string") return [];
    const text = (v: unknown) => (typeof v === "string" ? v : null);
    return [{ field: c.field, from: text(c.from), to: text(c.to) }];
  });
}
