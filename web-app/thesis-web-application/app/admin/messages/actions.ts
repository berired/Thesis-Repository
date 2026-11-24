"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";

/** Closes a conversation report: "RESOLVED" (action was taken) or "DISMISSED" (nothing wrong). */
export async function closeThreadReport(reportId: string, status: "RESOLVED" | "DISMISSED") {
  const session = await requireAdmin();
  await prisma.threadReport.updateMany({
    where: { id: reportId, status: "OPEN" },
    data: { status, resolvedAt: new Date(), resolvedById: session.user.id },
  });
  revalidatePath("/admin/messages");
}
