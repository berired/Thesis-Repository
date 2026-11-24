import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { unreadByThread } from "@/app/lib/messaging";
import { fmtDay, fmtTime } from "@/app/lib/time";

export default async function MessagesPage() {
  const session = await requireUser();
  const userId = session.user.id;

  // Only open conversations: the pet is in lost mode, not archived, and allows messages.
  const threads = await prisma.messageThread.findMany({
    where: {
      OR: [{ finderId: userId }, { pet: { ownerId: userId } }],
      pet: {
        lostMode: true,
        archivedAt: null,
        OR: [{ publicSettings: null }, { publicSettings: { allowMessage: true } }],
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      finder: { select: { name: true } },
      pet: {
        select: {
          name: true,
          ownerId: true,
          owner: { select: { name: true } },
          publicSettings: { select: { showName: true, showOwnerName: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true, createdAt: true } },
    },
  });
  const unread = await unreadByThread(userId);
  const first = (n: string) => n.split(/\s+/)[0] ?? n;

  return (
    <OwnerPage crumbs={[{ label: "Messages" }]}>
      <h1 className="font-display text-[36px] leading-[40px] text-forest sm:text-[44px] sm:leading-[48px]">
        Messages
      </h1>
      <p className="max-w-[560px] text-sm text-muted">
        Conversations about lost pets. They are only open while the pet is marked as lost.
      </p>

      {threads.length === 0 ? (
        <div className="max-w-[560px] rounded-xl border border-line bg-white p-6 text-sm text-muted">
          No conversations yet. When someone finds a lost pet and messages you, it shows up here.
          If you find a lost pet, scan its tag and choose &quot;Message in app&quot;.
        </div>
      ) : (
        <ul className="stagger flex max-w-[720px] flex-col gap-2">
          {threads.map((t) => {
            const isOwner = t.pet.ownerId === userId;
            const settings = t.pet.publicSettings;
            const other = isOwner
              ? first(t.finder.name)
              : (settings?.showOwnerName ?? true)
                ? first(t.pet.owner.name)
                : "The owner";
            const petName = isOwner || (settings?.showName ?? true) ? t.pet.name : "a lost pet";
            const last = t.messages[0];
            const count = unread.get(t.id) ?? 0;
            return (
              <li key={t.id}>
                <Link
                  href={`/messages/${t.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 hover:bg-[#f6f8fa]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {other} <span className="font-normal text-muted">about {petName}</span>
                      {t.blockedAt ? (
                        <span className="ml-2 rounded-md bg-[#eef0f3] px-2 py-0.5 text-xs font-semibold text-muted">
                          Blocked
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                      {last
                        ? `${last.senderId === userId ? "You: " : ""}${last.body}`
                        : "No messages yet"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {fmtDay(t.lastMessageAt)}, {fmtTime(t.lastMessageAt)}
                  </span>
                  {count > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky px-1.5 text-[11px] font-semibold text-white">
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </OwnerPage>
  );
}
