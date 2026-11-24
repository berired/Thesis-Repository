import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import { getAccessiblePet } from "./pet-data";

/**
 * One visible (not voided) record of a pet the signed-in user may read (as owner or caretaker),
 * with its files and the pet's `role` for them, or 404. Pages that change the record use
 * `getOwnedRecord` below, which refuses caretakers.
 */
export async function getViewableRecord(petId: string, recordId: string) {
  const pet = await getAccessiblePet(petId);
  const record = await prisma.healthRecord.findFirst({
    where: { id: recordId, petId: pet.id, voidedAt: null },
    include: {
      reminders: { select: { dueAt: true }, orderBy: { dueAt: "asc" } },
      edits: {
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, changes: true, editor: { select: { name: true } } },
      },
      addedNotes: {
        orderBy: { createdAt: "asc" },
        select: { id: true, createdAt: true, body: true, author: { select: { name: true } } },
      },
      files: {
        orderBy: { uploadedAt: "asc" },
        select: { id: true, fileName: true, sizeBytes: true, contentType: true },
      },
    },
  });
  if (!record) notFound();
  return { pet, record };
}

/** The same record, but only for the pet's owner: 404s for a caretaker. */
export async function getOwnedRecord(petId: string, recordId: string) {
  const found = await getViewableRecord(petId, recordId);
  if (found.pet.role !== "owner") notFound();
  return found;
}

/** yyyy-mm-dd for a date input. */
export const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export { timeInput } from "./time";
