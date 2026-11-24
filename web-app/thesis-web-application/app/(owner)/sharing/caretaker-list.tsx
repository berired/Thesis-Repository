import { prisma } from "@/app/lib/prisma";
import InviteForm from "./invite-form";
import { RemoveCaretaker } from "./share-buttons";

const STATUS_LABEL = { PENDING: "Invited", ACCEPTED: "Caretaker", DECLINED: "Declined" } as const;
const STATUS_CHIP = {
  PENDING: "bg-[#fff0cc] text-[#8a5a00]",
  ACCEPTED: "bg-[#e6f4ec] text-[#0f6b47]",
  DECLINED: "bg-[#eef0f3] text-muted",
} as const;

/** Owner's view inside the Edit animal page: who helps with this animal, and a way to invite more. */
export default async function CaretakerList({ petId, petName }: { petId: string; petName: string }) {
  const shares = await prisma.petShare.findMany({
    where: { petId },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, user: { select: { name: true, email: true } } },
  });

  return (
    <>
      {shares.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {shares.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1">
                <span className="font-medium">{s.user.name}</span>{" "}
                <span className="text-muted">{s.user.email}</span>
              </span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_CHIP[s.status]}`}>
                {STATUS_LABEL[s.status]}
              </span>
              <RemoveCaretaker shareId={s.id} name={s.user.name} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No caretakers yet.</p>
      )}

      <InviteForm pets={[{ id: petId, name: petName }]} />
    </>
  );
}
