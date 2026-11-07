"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { requireAdmin } from "@/app/lib/session";

async function requireOtherUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Missing user.");
  if (userId === session.user.id) {
    throw new Error("You can't change your own account here.");
  }
  return userId;
}

export async function banUser(formData: FormData) {
  const userId = await requireOtherUser(formData);
  await auth.api.banUser({ body: { userId }, headers: await headers() });
  revalidatePath("/admin/users");
}

export async function unbanUser(formData: FormData) {
  const userId = await requireOtherUser(formData);
  await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  revalidatePath("/admin/users");
}

export async function setUserRole(formData: FormData) {
  const userId = await requireOtherUser(formData);
  const role = String(formData.get("role"));
  if (role !== "admin" && role !== "user") throw new Error("Invalid role.");
  await auth.api.setRole({ body: { userId, role }, headers: await headers() });
  revalidatePath("/admin/users");
}
