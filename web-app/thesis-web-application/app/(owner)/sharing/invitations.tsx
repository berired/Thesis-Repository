import { prisma } from "@/app/lib/prisma";
import { InviteResponse } from "./share-buttons";

/** Invitations waiting for the signed-in user to accept or decline, shown at the top of My animals. */
export default async function Invitations({ userId }: { userId: string }) {
  const invites = await prisma.petShare.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pet: { select: { name: true, species: true, owner: { select: { name: true } } } },
    },
  });
  if (invites.length === 0) return null;

  return (
    <section id="invitations" className="flex flex-col gap-3 rounded-xl border-2 border-butter bg-[#fff6d1] p-4">
      <h2 className="text-base font-semibold">
        {invites.length === 1 ? "You have an invitation" : `You have ${invites.length} invitations`}
      </h2>
      <ul className="flex flex-col gap-3">
        {invites.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{i.pet.owner.name}</span> invited you to help care for{" "}
              <span className="font-semibold">{i.pet.name}</span> ({i.pet.species}). You&apos;d be
              able to see {i.pet.name}&apos;s records and complete reminders given to you.
            </p>
            <InviteResponse shareId={i.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
