import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtFull, fmtTime } from "@/app/lib/time";
import { RECORD_LABEL } from "@/app/lib/care";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { formatBytes } from "@/app/lib/upload-client";
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
      <Link href="/admin/records" className="text-sm underline">
        Back to vet records
      </Link>
      <h1 className="text-2xl font-semibold">{record.title}</h1>

      {record.voidedAt ? (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm">
          Voided on {stamp(record.voidedAt)}
          {voider ? ` by ${voider.actorName} (${voider.actorEmail})` : ""}. Reason:{" "}
          {record.voidReason}
        </p>
      ) : null}

      <dl className="flex flex-col gap-2 text-sm">
        {details
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <dt className="w-32 shrink-0 text-gray-600">{k}</dt>
              <dd className="whitespace-pre-line">{v}</dd>
            </div>
          ))}
      </dl>

      <section>
        <h2 className="mb-2 font-semibold">Files</h2>
        {record.files.length === 0 ? (
          <p className="text-sm text-gray-600">No files attached.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {record.files.map((f) => (
              <li key={f.id}>
                <a
                  href={`/api/admin/documents/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {f.fileName}
                </a>{" "}
                <span className="text-gray-600">{formatBytes(f.sizeBytes)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Reports</h2>
        {record.reports.length === 0 ? (
          <p className="text-sm text-gray-600">No one has reported this record.</p>
        ) : (
          record.reports.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 rounded border p-3 text-sm">
              <p>
                <span className="font-medium">
                  {r.reporter.name} ({r.reporter.email})
                </span>{" "}
                on {stamp(r.createdAt)} · {r.status.toLowerCase()}
              </p>
              <p className="whitespace-pre-line">{r.reason}</p>
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
        <section className="flex flex-col gap-2 rounded border border-red-300 p-4">
          <h2 className="font-semibold">Void this record</h2>
          <p className="text-sm text-gray-600">
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
