"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { getPetAccess } from "@/app/lib/pet-access";
import { parseRecordDate, parseRecordFields, syncPetWeight } from "@/app/lib/records";
import { parseDoseTimes, syncDoseReminders } from "@/app/lib/reminders";
import { requireUser } from "@/app/lib/session";
import { deleteFile } from "@/app/lib/storage";

export type RecordResult = { error: string } | { ok: true; petId: string; recordId: string };

function refresh(petId: string) {
  revalidatePath(`/pets/${petId}`, "layout");
  revalidatePath("/records");
}

/** Dose reminders only apply to a medication with an end date and at least one dose time. */
function doseRemindersFor(
  type: string,
  endDate: Date | null,
  fd: FormData,
): { ok: true; times: string[] } | { ok: false; error: string } {
  if (type !== "MEDICATION" || fd.get("remindDoses") !== "on") return { ok: true, times: [] };
  const times = parseDoseTimes(fd);
  if (times.length === 0) return { ok: false, error: "Add at least one dose time." };
  if (!endDate) return { ok: false, error: "Add an end date to set dose reminders." };
  return { ok: true, times };
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
  const doses = doseRemindersFor(parsed.data.type, parsed.data.endDate, fd);
  if (!doses.ok) return { error: doses.error };

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.healthRecord.create({
      data: { ...parsed.data, petId, source: "OWNER" },
      select: { id: true },
    });
    if (parsed.data.type === "WEIGHT") await syncPetWeight(tx, petId);
    if (doses.times.length > 0) {
      await syncDoseReminders(
        tx,
        { id: created.id, petId, title: parsed.data.title, endDate: parsed.data.endDate },
        session.user.id,
        doses.times,
      );
    }
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

  const doses = doseRemindersFor(parsed.data.type, parsed.data.endDate, fd);
  if (!doses.ok) return { error: doses.error };

  const session = await requireUser();
  await prisma.$transaction(async (tx) => {
    await tx.healthRecord.update({ where: { id: record.id }, data: parsed.data });
    if (parsed.data.type === "WEIGHT" || record.type === "WEIGHT") {
      await syncPetWeight(tx, record.petId);
    }
    // Always rewritten, so turning the option off (or changing the type) clears old dose reminders.
    await syncDoseReminders(
      tx,
      { id: record.id, petId: record.petId, title: parsed.data.title, endDate: parsed.data.endDate },
      session.user.id,
      doses.times,
    );
  });

  refresh(record.petId);
  return { ok: true, petId: record.petId, recordId: record.id };
}

/** Owner-made records only; vet-submitted records can never be deleted by the owner. */
export async function deleteRecord(recordId: string): Promise<RecordResult> {
  const record = await ownedRecord(recordId);
  if (!record) return { error: "We couldn't find that record." };
  if (record.source === "VET") {
    return { error: "Records added by a vet can't be deleted. Report it from the record page if it is wrong." };
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

const MAX_OPEN_REPORTS = 10;

/** An owner tells the admin that a vet-submitted record on their animal is wrong or abusive. */
export async function reportRecord(recordId: string, reason: string): Promise<{ error: string } | { ok: true }> {
  const record = await ownedRecord(recordId);
  if (!record || record.source !== "VET") return { error: "We couldn't find that record." };

  const text = reason.trim();
  if (text.length < 5) return { error: "Tell the admin what is wrong, in a few words." };
  if (text.length > 500) return { error: "Keep the reason under 500 characters." };

  const session = await requireUser();
  const [already, open] = await Promise.all([
    prisma.recordReport.count({
      where: { recordId: record.id, reporterId: session.user.id, status: "OPEN" },
    }),
    prisma.recordReport.count({ where: { reporterId: session.user.id, status: "OPEN" } }),
  ]);
  if (already > 0) return { error: "You already reported this record. The admin will look at it." };
  if (open >= MAX_OPEN_REPORTS) {
    return { error: "You have several reports waiting for the admin. Please wait for a reply." };
  }

  await prisma.recordReport.create({
    data: { recordId: record.id, reporterId: session.user.id, reason: text },
  });
  revalidatePath(`/pets/${record.petId}/records/${record.id}`);
  revalidatePath("/admin/records");
  return { ok: true };
}
