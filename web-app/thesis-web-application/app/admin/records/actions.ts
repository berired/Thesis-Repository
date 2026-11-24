"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { syncPetWeight } from "@/app/lib/records";

export type ModerationState = { error?: string; done?: string } | undefined;

function reasonOf(fd: FormData, required: boolean): { ok: true; reason: string } | { ok: false; error: string } {
  const reason = String(fd.get("reason") ?? "").trim();
  if (required && reason.length < 5) {
    return { ok: false, error: "Give a reason of at least 5 characters. It is kept in the audit trail." };
  }
  if (reason.length > 500) return { ok: false, error: "Keep the reason under 500 characters." };
  return { ok: true, reason: reason || "No action needed." };
}

function refresh(petId: string) {
  revalidatePath("/admin/records", "layout");
  revalidatePath(`/pets/${petId}`, "layout");
  revalidatePath("/records");
}

/**
 * Voids a vet-submitted record: it disappears from every owner view but stays in the
 * database, and a permanent audit entry says who voided it, when and why. Open reports
 * on it are marked resolved. Owner-made records are never voided; owners delete those.
 */
export async function voidRecord(recordId: string, _prev: ModerationState, fd: FormData): Promise<ModerationState> {
  const session = await requireAdmin();
  const parsed = reasonOf(fd, true);
  if (!parsed.ok) return { error: parsed.error };

  const record = await prisma.healthRecord.findFirst({
    where: { id: recordId, source: "VET", voidedAt: null },
    include: { pet: { select: { id: true, name: true, owner: { select: { email: true } } } } },
  });
  if (!record) return { error: "That record is already voided or isn't a vet-submitted record." };

  const now = new Date();
  const ok = await prisma.$transaction(async (tx) => {
    // Guards against two admins voiding at once: only one update can match.
    const claimed = await tx.healthRecord.updateMany({
      where: { id: record.id, voidedAt: null },
      data: { voidedAt: now, voidedById: session.user.id, voidReason: parsed.reason },
    });
    if (claimed.count === 0) return false;
    await tx.recordReport.updateMany({
      where: { recordId: record.id, status: "OPEN" },
      data: { status: "RESOLVED", resolvedAt: now, resolvedById: session.user.id },
    });
    await tx.auditEntry.create({
      data: {
        action: "RECORD_VOIDED",
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        recordId: record.id,
        petId: record.pet.id,
        petName: record.pet.name,
        ownerEmail: record.pet.owner.email,
        recordTitle: record.title,
        recordType: record.type,
        recordDate: record.recordDate,
        vetName: record.vetName,
        clinic: record.clinic,
        reason: parsed.reason,
        createdAt: now,
      },
    });
    if (record.type === "WEIGHT") await syncPetWeight(tx, record.petId);
    return true;
  });
  if (!ok) return { error: "That record was just voided by someone else." };

  refresh(record.petId);
  return { done: "Record voided. It is hidden from the owner and kept in the audit trail." };
}

/** Closes a report without touching the record. The decision is written to the audit trail. */
export async function dismissReport(reportId: string, _prev: ModerationState, fd: FormData): Promise<ModerationState> {
  const session = await requireAdmin();
  const parsed = reasonOf(fd, false);
  if (!parsed.ok) return { error: parsed.error };

  const report = await prisma.recordReport.findFirst({
    where: { id: reportId, status: "OPEN" },
    include: {
      record: {
        include: { pet: { select: { id: true, name: true, owner: { select: { email: true } } } } },
      },
    },
  });
  if (!report) return { error: "That report is already closed." };

  const { record } = report;
  const now = new Date();
  const ok = await prisma.$transaction(async (tx) => {
    const claimed = await tx.recordReport.updateMany({
      where: { id: report.id, status: "OPEN" },
      data: { status: "DISMISSED", resolvedAt: now, resolvedById: session.user.id },
    });
    if (claimed.count === 0) return false;
    await tx.auditEntry.create({
      data: {
        action: "REPORT_DISMISSED",
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        recordId: record.id,
        petId: record.pet.id,
        petName: record.pet.name,
        ownerEmail: record.pet.owner.email,
        recordTitle: record.title,
        recordType: record.type,
        recordDate: record.recordDate,
        vetName: record.vetName,
        clinic: record.clinic,
        reason: parsed.reason,
        createdAt: now,
      },
    });
    return true;
  });
  if (!ok) return { error: "That report was just closed by someone else." };

  revalidatePath("/admin/records", "layout");
  return { done: "Report dismissed." };
}
