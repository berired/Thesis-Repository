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
  const address = String(fd.get("address") ?? "").trim().slice(0, 200);
  const showPhone = fd.get("showPhone") === "on";
  const showAddress = fd.get("showAddress") === "on";

  const phone = phoneRaw ? cleanPhone(phoneRaw) : null;
  if (phoneRaw && !phone) return { error: PHONE_ERROR };
  // Nothing to show means nothing to switch on.
  if (showPhone && !phone) return { error: "Add a contact number before showing it." };
  if (showAddress && !address) return { error: "Add an address before showing it." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone, address: address || null, showPhone, showAddress },
  });

  revalidatePath("/", "layout");
  return { saved: true };
}
