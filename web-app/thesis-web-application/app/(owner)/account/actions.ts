"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { PHONE_ERROR, cleanPhone } from "@/app/lib/phone";

export type AccountState = { error?: string; saved?: boolean };

/** Updates the signed-in owner's contact details. The name is deliberately not editable. */
export async function updateAccount(
  _prev: AccountState,
  fd: FormData,
): Promise<AccountState> {
  const session = await requireUser();

  const phoneRaw = String(fd.get("phone") ?? "").trim();
  const city = String(fd.get("city") ?? "").trim().slice(0, 80);

  const phone = phoneRaw ? cleanPhone(phoneRaw) : null;
  if (phoneRaw && !phone) return { error: PHONE_ERROR };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone, city: city || null },
  });

  revalidatePath("/", "layout");
  return { saved: true };
}
