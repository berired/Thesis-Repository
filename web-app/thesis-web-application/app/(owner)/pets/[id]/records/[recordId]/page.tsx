import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import Icon from "@/app/components/app-icon";
import { RECORD_ICON, RECORD_LABEL, fmtFull } from "@/app/lib/care";
import { getViewableRecord } from "@/app/lib/record-data";
import { formatBytes } from "@/app/lib/upload-client";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import ReportRecord from "./report-record";
import AddNote from "./add-note";
import { readChanges } from "@/app/lib/record-history";
import { fmtEdited } from "@/app/lib/time";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = await params;
  const { pet, record } = await getViewableRecord(id, recordId);
  const isOwner = pet.role === "owner";
  const fromVet = record.source === "VET";
  const session = await requireUser();
  const alreadyReported = fromVet && isOwner
    ? (await prisma.recordReport.count({
        where: {
          recordId: record.id,
          reporterId: session.user.id,
          status: "OPEN",
        },
      })) > 0
    : false;

  const details: [string, string | null][] = [
    ["Type", RECORD_LABEL[record.type]],
    ["Date", fmtFull(record.recordDate)],
    ["Dose", record.dose],
    ["End date", record.endDate ? fmtFull(record.endDate) : null],
    ["Batch / lot no.", record.batchNumber],
    ["Next dose due", record.nextDueDate ? fmtFull(record.nextDueDate) : null],
    ["Weight", record.weightKg !== null ? `${record.weightKg} kg` : null],
    [fromVet ? "Vet" : "Clinic", fromVet ? record.vetName : record.clinic],
    ["Clinic", fromVet ? record.clinic : null],
  ];

  return (
    <OwnerPage
      crumbs={[
        { label: "My animals", href: "/pets" },
        { label: pet.name, href: `/pets/${pet.id}` },
        { label: "Health records", href: `/pets/${pet.id}/records` },
        { label: record.title },
      ]}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-3 font-display text-[34px] leading-[38px] text-forest">
            <Icon name={RECORD_ICON[record.type]} size={28} />
            {record.title}
          </h1>
          <p className="text-sm text-muted">For {pet.name}</p>
          {record.edits[0] ? (
            <p className="text-[13px] text-muted">
              Edited on {fmtEdited(record.edits[0].createdAt)}
            </p>
          ) : null}
          {fromVet ? (
            <p className="flex w-fit items-center gap-1.5 rounded-md bg-[#e6eefb] px-2.5 py-1 text-xs font-semibold text-[#2a559e]">
              <Icon name="stethoscope" size={13} />
              Vet-submitted
              {record.vetName ? ` · ${record.vetName}` : ""}
            </p>
          ) : null}
        </div>
        {isOwner ? (
        <Link
          href={`/pets/${pet.id}/records/${record.id}/edit`}
          className="flex h-10 items-center gap-2 rounded-lg border border-[#c3c9d1] bg-white px-4 text-sm font-semibold text-ink hover:bg-[#f6f8fa]"
        >
          <Icon name="pencil" size={15} />
          {fromVet ? "Edit visit date" : "Edit"}
        </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <dl className="flex flex-col gap-3">
            {details
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex gap-4 text-sm leading-[21px]">
                  <dt className="w-[120px] shrink-0 text-muted">{label}</dt>
                  <dd className="min-w-0 font-medium">{value}</dd>
                </div>
              ))}
          </dl>
          {record.notes ? (
            <p className="whitespace-pre-line rounded-lg bg-cream px-3 py-2 text-[13px] leading-[19.5px] text-muted">
              {record.notes}
            </p>
          ) : null}
          {fromVet ? (
            <>
              <p className="text-[13px] text-muted">
                Added by a vet through a one-time link, so it can&apos;t be
                deleted. Only the visit date can be changed, and you can add
                notes below. If something is wrong, report it and the admin will
                review it.
              </p>
              <ReportRecord
                recordId={record.id}
                alreadyReported={alreadyReported}
              />
            </>
          ) : null}
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold leading-6">
              Attachments
            </h2>
            {record.files.length === 0 ? (
              <p className="text-sm text-muted">No files attached.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {record.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3">
                    <Icon
                      name="file-text"
                      size={18}
                      className="shrink-0 text-sky"
                    />
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/api/pets/${pet.id}/documents/${f.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-semibold text-ink hover:underline"
                      >
                        {f.fileName}
                      </a>
                      <p className="text-xs text-muted">
                        {formatBytes(f.sizeBytes)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">
              Saved files can&apos;t be edited or removed.
              {isOwner && !fromVet ? " New files can still be added from Edit." : ""}
            </p>
          </section>
        </div>
      </div>

      <section className="flex max-w-[700px] flex-col gap-4 rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-semibold leading-6">Notes</h2>
        {record.addedNotes.length === 0 ? (
          <p className="text-sm text-muted">No notes added yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {record.addedNotes.map((n) => (
              <li key={n.id} className="rounded-lg bg-cream px-3 py-2">
                <p className="whitespace-pre-line text-[13px] leading-[19.5px]">
                  {n.body}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {n.author?.name ?? "Someone"} · {fmtEdited(n.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {isOwner ? <AddNote recordId={record.id} /> : null}
      </section>

      <section className="flex max-w-[700px] flex-col gap-3 rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-semibold leading-6">History</h2>
        {record.edits.length === 0 ? (
          <p className="text-sm text-muted">
            This record hasn&apos;t been edited.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {record.edits.map((e) => (
              <li key={e.id} className="text-[13px] leading-[19.5px]">
                <p className="font-semibold">
                  Edited on {fmtEdited(e.createdAt)}
                  <span className="font-normal text-muted">
                    {" "}
                    · {e.editor?.name ?? "Someone"}
                  </span>
                </p>
                <ul className="mt-1 flex flex-col gap-0.5 text-muted">
                  {readChanges(e.changes).map((c, i) => (
                    <li key={i}>
                      {c.field === "File added"
                        ? `File added: ${c.to}`
                        : `${c.field}: ${c.from ?? "empty"} → ${c.to ?? "empty"}`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </OwnerPage>
  );
}
