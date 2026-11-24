import Link from "next/link";
import { fmtFull, fmtTime } from "@/app/lib/time";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
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
      <h1 className="text-2xl font-semibold">Reported conversations</h1>
      <p className="max-w-2xl text-sm text-gray-600">
        Lost-pet messages that someone reported. They are blocked until the person who blocked
        them lifts it. To stop an account, ban it from{" "}
        <Link href="/admin/users" className="underline">
          Users
        </Link>
        .
      </p>

      {reports.length === 0 ? <p className="text-sm text-gray-600">No open reports.</p> : null}

      {reports.map((r) => {
        const { thread } = r;
        const who = (id: string) =>
          id === thread.finderId
            ? `${thread.finder.name} (finder)`
            : `${thread.pet.owner.name} (owner)`;
        return (
          <section key={r.id} className="flex max-w-3xl flex-col gap-3 rounded border p-4 text-sm">
            <p>
              <span className="font-medium">
                {r.reporter.name} ({r.reporter.email})
              </span>{" "}
              reported this on {stamp(r.createdAt)}
            </p>
            <p className="whitespace-pre-line rounded bg-gray-50 p-2">{r.reason}</p>
            <p className="text-gray-600">
              About {thread.pet.name}. Owner: {thread.pet.owner.name} ({thread.pet.owner.email}).
              Finder: {thread.finder.name} ({thread.finder.email}).
            </p>
            <ul className="flex flex-col gap-1 rounded border p-2">
              {thread.messages.length === 0 ? (
                <li className="text-gray-600">No messages.</li>
              ) : (
                thread.messages.map((m) => (
                  <li key={m.id}>
                    <span className="font-medium">{who(m.senderId)}</span>{" "}
                    <span className="text-gray-600">{stamp(m.createdAt)}</span>
                    <p className="whitespace-pre-line">{m.body}</p>
                  </li>
                ))
              )}
            </ul>
            <div className="flex gap-3">
              <form action={closeThreadReport.bind(null, r.id, "RESOLVED")}>
                <button type="submit" className="rounded bg-gray-800 px-3 py-1.5 text-white">
                  Mark resolved
                </button>
              </form>
              <form action={closeThreadReport.bind(null, r.id, "DISMISSED")}>
                <button type="submit" className="rounded border px-3 py-1.5">
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
