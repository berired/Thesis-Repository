import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { loadThread } from "@/app/lib/messaging";
import { getSession } from "@/app/lib/session";

// Polled by an open chat. Returns messages newer than `after` and marks the thread read
// for the caller. Anyone who is not part of the thread (or when it is unavailable) gets 404.
export async function GET(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { threadId } = await params;
  const found = await loadThread(session.user.id, threadId);
  if (!found) return new NextResponse(null, { status: 404 });

  const afterParam = new URL(req.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : null;

  const messages = await prisma.message.findMany({
    where: { threadId, ...(after && !Number.isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  const now = new Date();
  await prisma.messageThread.update({
    where: { id: threadId },
    data: found.side === "owner" ? { ownerReadAt: now } : { finderReadAt: now },
  });

  return NextResponse.json(
    {
      blocked: found.blocked,
      messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
