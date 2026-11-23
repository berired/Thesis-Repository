import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";

/** Opens a notification: marks it read, then goes to where it points. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  const { id } = await params;
  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, href: true, readAt: true },
  });
  if (!notification) return NextResponse.redirect(new URL("/notifications", request.url));
  if (!notification.readAt) {
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
  const to =
    notification.href && /^\/(?!\/)/.test(notification.href) ? notification.href : "/notifications";
  return NextResponse.redirect(new URL(to, request.url));
}
