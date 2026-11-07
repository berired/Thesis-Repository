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
