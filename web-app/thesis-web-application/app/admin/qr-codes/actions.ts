"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { generateCode, renderQrPng } from "@/app/lib/qr";
import { deleteQrCode as removeQrCode } from "@/app/lib/qr-codes";
import { deleteQrImage, uploadQrImage } from "@/app/lib/storage";
import { requireAdmin } from "@/app/lib/session";

const MAX_PER_BATCH = 100;

export type CreateQrState = { error?: string; created?: number };

export async function createQrCodes(
  _prev: CreateQrState,
  formData: FormData,
): Promise<CreateQrState> {
  const session = await requireAdmin();

  const count = Number(formData.get("count"));
  const batch = String(formData.get("batch") ?? "").trim() || null;

  if (!Number.isInteger(count) || count < 1 || count > MAX_PER_BATCH) {
    return { error: `Count must be a whole number from 1 to ${MAX_PER_BATCH}.` };
  }

  const rows = Array.from({ length: count }, () => {
    const code = generateCode();
    return { code, imageKey: `qr/${code}.png` };
  });

  try {
    await Promise.all(
      rows.map(async ({ code, imageKey }) =>
        uploadQrImage(imageKey, await renderQrPng(code)),
      ),
    );
  } catch {
    await Promise.allSettled(rows.map((r) => deleteQrImage(r.imageKey)));
    return { error: "Could not upload QR images. Nothing was created." };
  }

  try {
    await prisma.qrCode.createMany({
      data: rows.map((r) => ({ ...r, batch, createdById: session.user.id })),
    });
  } catch {
    await Promise.allSettled(rows.map((r) => deleteQrImage(r.imageKey)));
    return { error: "Could not save QR codes. Nothing was created." };
  }

  revalidatePath("/admin/qr-codes");
  return { created: count };
}

/**
 * Remembers that a code's link was written onto a physical NFC tag, and which chip it was.
 * Later, an owner who taps that tag to register it must tap this same chip.
 */
export async function recordNfcWrite(
  id: string,
  serial: string | null,
): Promise<{ error?: string }> {
  await requireAdmin();
  const clean = (serial ?? "").toLowerCase();
  if (clean && !/^[0-9a-f]{2}(:[0-9a-f]{2}){3,9}$/.test(clean)) {
    return { error: "The tag's serial number looked wrong. Try writing it again." };
  }
  const { count } = await prisma.qrCode.updateMany({
    where: { id },
    data: { nfcWrittenAt: new Date(), nfcSerial: clean || null },
  });
  if (count === 0) return { error: "That code no longer exists." };
  revalidatePath("/admin/qr-codes");
  return {};
}

/** Sets or clears one code's label (stored in the `batch` column). */
export async function updateQrLabel(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing QR code.");
  const label = String(formData.get("label") ?? "").trim().slice(0, 80) || null;

  await prisma.qrCode.update({ where: { id }, data: { batch: label } });
  revalidatePath("/admin/qr-codes");
}

export async function deleteQrCode(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing QR code.");

  const result = await removeQrCode(id);
  if (result === "claimed") {
    throw new Error("This QR code is linked to a pet and can't be deleted.");
  }
  revalidatePath("/admin/qr-codes");
}
