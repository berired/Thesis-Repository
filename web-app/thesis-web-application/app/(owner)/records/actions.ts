"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { parseRecordDate, parseRecordFields, syncPetWeight } from "@/app/lib/records";
import { requireUser } from "@/app/lib/session";
import { deleteFile } from "@/app/lib/storage";

export type RecordResult = { error: string } | { ok: true; petId: string; recordId: string };

function refresh(petId: string) {
  revalidatePath(`/pets/${petId}`, "layout");
  revalidatePath("/records");
}

/** The record, if it exists, is visible (not voided) and belongs to a pet the user owns. */
async function ownedRecord(recordId: string) {
  const session = await requireUser();
  const record = await prisma.healthRecord.findFirst({
    where: { id: recordId, voidedAt: null },
    select: { id: true, petId: true, source: true, type: true },
  });
  if (!record) return null;
  if ((await getPetAccess(session.user.id, record.petId)) !== "owner") return null;
  return record;
}

export async function createRecord(fd: FormData): Promise<RecordResult> {
  const session = await requireUser();
  const petId = String(fd.get("petId") ?? "");
  if ((await getPetAccess(session.user.id, petId)) !== "owner") {
    return { error: "We couldn't find that animal." };
  }

  const parsed = parseRecordFields(fd);
  if (!parsed.ok) return { error: parsed.error };

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.healthRecord.create({
      data: { ...parsed.data, petId, source: "OWNER" },
      select: { id: true },
    });
    if (parsed.data.type === "WEIGHT") await syncPetWeight(tx, petId);
    return created;
  });

  refresh(petId);
  return { ok: true, petId, recordId: record.id };
}

/**
 * Owner-made records are fully editable. A vet-submitted record only lets the
 * owner change its visit date; everything else is ignored, whatever the form sent.
 */
export async function updateRecord(recordId: string, fd: FormData): Promise<RecordResult> {
  const record = await ownedRecord(recordId);
  if (!record) return { error: "We couldn't find that record." };

  if (record.source === "VET") {
    const date = parseRecordDate(fd);
    if (!date.ok) return { error: date.error };
    await prisma.healthRecord.update({ where: { id: record.id }, data: { recordDate: date.date } });
    refresh(record.petId);
    return { ok: true, petId: record.petId, recordId: record.id };
  }

  const parsed = parseRecordFields(fd);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.$transaction(async (tx) => {
    await tx.healthRecord.update({ where: { id: record.id }, data: parsed.data });
    if (parsed.data.type === "WEIGHT" || record.type === "WEIGHT") {
      await syncPetWeight(tx, record.petId);
    }
  });

  refresh(record.petId);
  return { ok: true, petId: record.petId, recordId: record.id };
}

/** Owner-made records only; vet-submitted records can never be deleted by the owner. */
export async function deleteRecord(recordId: string): Promise<RecordResult> {
  const record = await ownedRecord(recordId);
  if (!record) return { error: "We couldn't find that record." };
  if (record.source === "VET") {
    return { error: "Records added by a vet can't be deleted. Contact the admin if one is wrong." };
  }

  // PetDocument.recordId is SetNull, so remove the files explicitly or they would linger.
  const files = await prisma.petDocument.findMany({
    where: { recordId: record.id },
    select: { fileKey: true },
  });
  await prisma.$transaction(async (tx) => {
    await tx.petDocument.deleteMany({ where: { recordId: record.id } });
    await tx.healthRecord.delete({ where: { id: record.id } });
    if (record.type === "WEIGHT") await syncPetWeight(tx, record.petId);
  });
  await Promise.allSettled(files.map((f) => deleteFile(f.fileKey)));

  refresh(record.petId);
  return { ok: true, petId: record.petId, recordId: record.id };
}
