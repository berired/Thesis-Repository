import { prisma } from "@/app/lib/prisma";
import { fmtDay, fmtTime } from "@/app/lib/care";
import { revokeRecordRequest } from "./vet-qr-actions";

type Status = { label: string; chip: string; revocable: boolean };

function statusOf(
  r: { revokedAt: Date | null; usedAt: Date | null; burnedAt: Date | null; expiresAt: Date; sessionExpiresAt: Date | null },
  now: Date,
): Status {
  if (r.revokedAt) return { label: "Cancelled", chip: "bg-[#eef0f3] text-muted", revocable: false };
  if (r.usedAt) return { label: "Used", chip: "bg-[#e6f4ec] text-[#0f6b47]", revocable: false };
  if (r.burnedAt) {
    return r.sessionExpiresAt && r.sessionExpiresAt > now
      ? { label: "Vet is adding a record", chip: "bg-[#e6eefb] text-[#2a559e]", revocable: true }
      : { label: "Opened, nothing sent", chip: "bg-[#eef0f3] text-muted", revocable: false };
  }
  if (r.expiresAt <= now) return { label: "Expired", chip: "bg-[#eef0f3] text-muted", revocable: false };
  return { label: "Waiting for the vet", chip: "bg-[#fff0cc] text-[#8a5a00]", revocable: true };
}

/** Recent vet QR codes for a pet, with a cancel button on the ones that are still live. */
export default async function VetQrList({ petId }: { petId: string }) {
  const now = new Date();
  const requests = await prisma.recordRequest.findMany({
    where: { petId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      burnedAt: true,
      usedAt: true,
      revokedAt: true,
      sessionExpiresAt: true,
      record: { select: { title: true, vetName: true } },
    },
  });
  if (requests.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[26px] leading-7 text-forest">Vet QR codes</h2>
      <ul className="flex flex-col gap-2">
        {requests.map((r) => {
          const status = statusOf(r, now);
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-white px-4 py-3 text-sm"
            >
              <span className="text-muted">
                Made {fmtDay(r.createdAt)}, {fmtTime(r.createdAt)}
              </span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${status.chip}`}>
                {status.label}
              </span>
              {r.record ? (
                <span className="min-w-0 flex-1 truncate">
                  {r.record.title}
                  {r.record.vetName ? ` · ${r.record.vetName}` : ""}
                </span>
              ) : (
                <span className="flex-1" />
              )}
              {status.revocable ? (
                <form action={revokeRecordRequest.bind(null, r.id)}>
                  <button type="submit" className="text-[13px] font-medium text-[#b42318] underline">
                    Cancel QR
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
