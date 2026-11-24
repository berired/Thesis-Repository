import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import { getOwnedPet } from "./pet-data";

/** One visible (not voided) record of a pet the signed-in user owns, with its files, or 404. */
export async function getOwnedRecord(petId: string, recordId: string) {
  const pet = await getOwnedPet(petId);
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

/** yyyy-mm-dd for a date input. */
export const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export { timeInput } from "./time";
