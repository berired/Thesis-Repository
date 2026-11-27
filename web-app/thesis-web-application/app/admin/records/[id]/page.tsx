import { notFound } from "next/navigation";
import { fmtFull, fmtTime } from "@/app/lib/time";
import { RECORD_LABEL } from "@/app/lib/care";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { formatBytes } from "@/app/lib/upload-client";
import { CARD, PageHeader, Pill } from "../../ui";
import { dismissReport, voidRecord } from "../actions";
import ModerationForm from "../moderation-form";

const stamp = (d: Date) => `${fmtFull(d)}, ${fmtTime(d)}`;

export default async function AdminRecordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const record = await prisma.healthRecord.findFirst({
    where: { id, source: "VET" },
    include: {
      pet: { select: { name: true, owner: { select: { name: true, email: true } } } },
      files: { orderBy: { uploadedAt: "asc" } },
      reports: {
        orderBy: { createdAt: "asc" },
        include: { reporter: { select: { name: true, email: true } } },
      },
    },
  });
  if (!record) notFound();

  const voider = record.voidedAt
    ? await prisma.auditEntry.findFirst({
        where: { recordId: record.id, action: "RECORD_VOIDED" },
        select: { actorName: true, actorEmail: true },
      })
    : null;

  const details: [string, string | null][] = [
    ["Type", RECORD_LABEL[record.type]],
    ["Record date", fmtFull(record.recordDate)],
    ["Submitted", stamp(record.createdAt)],
    ["Animal", record.pet.name],
    ["Owner", `${record.pet.owner.name} (${record.pet.owner.email})`],
    ["Vet", record.vetName],
    ["Clinic", record.clinic],
    ["Dose", record.dose],
    ["End date", record.endDate ? fmtFull(record.endDate) : null],
    ["Batch / lot no.", record.batchNumber],
    ["Next dose due", record.nextDueDate ? fmtFull(record.nextDueDate) : null],
    ["Weight", record.weightKg !== null ? `${record.weightKg} kg` : null],
    ["Notes", record.notes],
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={record.title}
        back={{ href: "/admin/records", label: "Back to vet records" }}
        actions={<Pill tone="blue">{RECORD_LABEL[record.type]}</Pill>}
      />

      {record.voidedAt ? (
        <p className="rounded-xl bg-blush-soft px-4 py-3 text-sm leading-[21px] text-blush-ink">
          <span className="font-semibold">Voided</span> on {stamp(record.voidedAt)}
          {voider ? ` by ${voider.actorName} (${voider.actorEmail})` : ""}. Reason:{" "}
          {record.voidReason}
        </p>
      ) : null}

      <section className={`${CARD} p-5`}>
        <dl className="flex flex-col divide-y divide-line text-sm">
          {details
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex gap-3 py-2.5 first:pt-0 last:pb-0 sm:gap-4">
                <dt className="w-24 shrink-0 text-muted sm:w-36">{k}</dt>
                <dd className="min-w-0 break-words whitespace-pre-line">{v}</dd>
              </div>
            ))}
        </dl>
      </section>

      <section className={`${CARD} flex flex-col gap-3 p-5`}>
        <h2 className="text-base font-semibold">Files</h2>
        {record.files.length === 0 ? (
          <p className="text-sm text-muted">No files attached.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {record.files.map((f) => (
              <li key={f.id}>
                <a
                  href={`/api/admin/documents/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-sky hover:underline"
                >
                  {f.fileName}
                </a>{" "}
                <span className="text-muted">{formatBytes(f.sizeBytes)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Reports</h2>
        {record.reports.length === 0 ? (
          <p className={`${CARD} px-5 py-4 text-sm text-muted`}>
            No one has reported this record.
          </p>
        ) : (
          record.reports.map((r) => (
            <div key={r.id} className={`${CARD} flex flex-col gap-3 p-5 text-sm`}>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold">
                  {r.reporter.name} ({r.reporter.email})
                </span>
                <span className="text-muted">on {stamp(r.createdAt)}</span>
                <Pill tone={r.status === "OPEN" ? "yellow" : r.status === "RESOLVED" ? "green" : "gray"}>
                  {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                </Pill>
              </p>
              <p className="whitespace-pre-line leading-[21px]">{r.reason}</p>
              {r.status === "OPEN" ? (
                <ModerationForm
                  action={dismissReport.bind(null, r.id)}
                  label="Dismiss report"
                  pendingLabel="Dismissing…"
                  placeholder="Why no action is needed (optional)"
                  required={false}
                />
              ) : null}
            </div>
          ))
        )}
      </section>

      {!record.voidedAt ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-[#e8b4b0] bg-white p-5">
          <h2 className="text-base font-semibold text-[#c2372e]">Void this record</h2>
          <p className="text-sm leading-[21px] text-muted">
            The owner will no longer see it. It stays in the audit trail with your name, the time
            and the reason, and cannot be restored.
          </p>
          <ModerationForm
            action={voidRecord.bind(null, record.id)}
            label="Void record"
            pendingLabel="Voiding…"
            placeholder="Reason (required, kept in the audit trail)"
            required
            danger
            confirm="Void this record? This cannot be undone."
          />
        </section>
      ) : null}
    </div>
  );
}
