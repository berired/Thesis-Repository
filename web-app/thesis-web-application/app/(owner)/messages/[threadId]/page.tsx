import { notFound } from "next/navigation";
import OwnerPage from "@/app/components/owner-page";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { loadThread } from "@/app/lib/messaging";
import Chat from "./chat";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const session = await requireUser();
  const found = await loadThread(session.user.id, threadId);
  if (!found) notFound();

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  // Opening the conversation reads it.
  await prisma.messageThread.update({
    where: { id: threadId },
    data: found.side === "owner" ? { ownerReadAt: new Date() } : { finderReadAt: new Date() },
  });

  return (
    <OwnerPage
      crumbs={[{ label: "Messages", href: "/messages" }, { label: `${found.otherName}, about ${found.petName}` }]}
    >
      <Chat
        threadId={threadId}
        selfId={session.user.id}
        otherName={found.otherName}
        petName={found.petName}
        initialBlocked={found.blocked}
        iBlocked={found.thread.blockedById === session.user.id}
        initial={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      />
    </OwnerPage>
  );
}
