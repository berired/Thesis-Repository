import Link from "next/link";
import { fmtFull, fmtTime } from "@/app/lib/time";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, EmptyState, PageHeader } from "../ui";
import { closeThreadReport } from "./actions";

const stamp = (d: Date) => `${fmtFull(d)}, ${fmtTime(d)}`;

export default async function AdminMessagesPage() {
  await requireAdmin();

  const reports = await prisma.threadReport.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      reporter: { select: { name: true, email: true } },
      thread: {
        include: {
          finder: { select: { name: true, email: true } },
          pet: { select: { name: true, owner: { select: { name: true, email: true } } } },
          messages: {
            orderBy: { createdAt: "asc" },
            take: 100,
            select: { id: true, senderId: true, body: true, createdAt: true },
          },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reported conversations"
        description={
          <>
            Lost-pet messages that someone reported. They are blocked until the person who blocked
            them lifts it. To stop an account, ban it from{" "}
            <Link href="/admin/users" className="font-medium text-sky hover:underline">
              Users
            </Link>
            .
          </>
        }
      />

      {reports.length === 0 ? <EmptyState>No open reports.</EmptyState> : null}

      {reports.map((r) => {
        const { thread } = r;
        const who = (id: string) =>
          id === thread.finderId
            ? `${thread.finder.name} (finder)`
            : `${thread.pet.owner.name} (owner)`;
        return (
          <section key={r.id} className={`${CARD} flex max-w-3xl flex-col gap-4 p-5 text-sm`}>
            <p className="leading-[21px]">
              <span className="font-semibold">
                {r.reporter.name} ({r.reporter.email})
              </span>{" "}
              <span className="text-muted">reported this on {stamp(r.createdAt)}</span>
            </p>
            <p className="whitespace-pre-line rounded-xl bg-blush-soft px-4 py-3 leading-[21px] text-blush-ink">
              {r.reason}
            </p>
            <p className="leading-[21px] text-muted">
              About {thread.pet.name}. Owner: {thread.pet.owner.name} ({thread.pet.owner.email}).
              Finder: {thread.finder.name} ({thread.finder.email}).
            </p>
            <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-cream/50">
              {thread.messages.length === 0 ? (
                <li className="px-4 py-3 text-muted">No messages.</li>
              ) : (
                thread.messages.map((m) => (
                  <li key={m.id} className="px-4 py-3">
                    <span className="font-semibold">{who(m.senderId)}</span>{" "}
                    <span className="text-[13px] text-muted">{stamp(m.createdAt)}</span>
                    <p className="mt-0.5 whitespace-pre-line leading-[21px]">{m.body}</p>
                  </li>
                ))
              )}
            </ul>
            <div className="flex flex-wrap gap-2">
              <form action={closeThreadReport.bind(null, r.id, "RESOLVED")}>
                <button type="submit" className={BTN_PRIMARY}>
                  Mark resolved
                </button>
              </form>
              <form action={closeThreadReport.bind(null, r.id, "DISMISSED")}>
                <button type="submit" className={BTN_OUTLINE}>
                  Dismiss
                </button>
              </form>
            </div>
          </section>
        );
      })}
    </div>
  );
}
