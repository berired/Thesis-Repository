import Link from "next/link";
import { fmtFull, fmtTime } from "@/app/lib/time";
import { RECORD_LABEL } from "@/app/lib/care";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { EmptyRow, PageHeader, Pill, ROW, TD, TH, THead, TableCard } from "../ui";

const VIEWS = [
  { id: "reports", label: "Reports" },
  { id: "records", label: "Vet records" },
  { id: "audit", label: "Audit trail" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const stamp = (d: Date) => `${fmtFull(d)}, ${fmtTime(d)}`;

const REVIEW_LINK = "font-medium text-sky hover:underline";

export default async function AdminRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const { view: raw } = await searchParams;
  const view: View = VIEWS.some((v) => v.id === raw) ? (raw as View) : "reports";

  const openReports = await prisma.recordReport.count({ where: { status: "OPEN" } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vet records"
        description="Records submitted by vets through a QR scan, the reports against them, and what admins did about it."
      />
      <nav aria-label="Views" className="flex flex-wrap gap-2">
        {VIEWS.map((v) => {
          const active = v.id === view;
          return (
            <Link
              key={v.id}
              href={`/admin/records?view=${v.id}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${
                active
                  ? "border-forest bg-forest text-white"
                  : "border-line bg-white text-ink hover:bg-[#f6f8fa]"
              }`}
            >
              {v.label}
              {v.id === "reports" && openReports > 0 ? (
                <span
                  className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                    active ? "bg-butter text-ink" : "bg-sky text-white"
                  }`}
                >
                  {openReports}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      {view === "reports" ? <Reports /> : view === "records" ? <VetRecords /> : <Audit />}
    </div>
  );
}

async function Reports() {
  const reports = await prisma.recordReport.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      reporter: { select: { name: true, email: true } },
      record: {
        select: {
          id: true,
          title: true,
          type: true,
          vetName: true,
          clinic: true,
          pet: { select: { name: true } },
        },
      },
    },
  });
  return (
    <TableCard minWidth="56rem">
      <THead>
        <TH>Reported</TH>
        <TH>Record</TH>
        <TH>Animal</TH>
        <TH>Vet</TH>
        <TH>Reporter</TH>
        <TH>Reason</TH>
        <TH />
      </THead>
      <tbody>
        {reports.map((r) => (
          <tr key={r.id} className={ROW}>
            <td className={`${TD} whitespace-nowrap text-muted`}>{stamp(r.createdAt)}</td>
            <td className={TD}>
              <span className="font-medium">{r.record.title}</span>{" "}
              <Pill tone="blue">{RECORD_LABEL[r.record.type]}</Pill>
            </td>
            <td className={TD}>{r.record.pet.name}</td>
            <td className={TD}>
              {r.record.vetName ?? "-"}
              {r.record.clinic ? `, ${r.record.clinic}` : ""}
            </td>
            <td className={TD}>
              {r.reporter.name}
              <span className="block text-[13px] text-muted">{r.reporter.email}</span>
            </td>
            <td className={`${TD} max-w-xs whitespace-pre-line`}>{r.reason}</td>
            <td className={TD}>
              <Link href={`/admin/records/${r.record.id}`} className={REVIEW_LINK}>
                Review
              </Link>
            </td>
          </tr>
        ))}
        {reports.length === 0 && <EmptyRow cols={7}>No open reports.</EmptyRow>}
      </tbody>
    </TableCard>
  );
}

async function VetRecords() {
  const records = await prisma.healthRecord.findMany({
    where: { source: "VET", voidedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      pet: { select: { name: true } },
      _count: { select: { reports: { where: { status: "OPEN" } } } },
    },
  });
  return (
    <TableCard minWidth="44rem">
      <THead>
        <TH>Added</TH>
        <TH>Record</TH>
        <TH>Animal</TH>
        <TH>Vet</TH>
        <TH>Open reports</TH>
        <TH />
      </THead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id} className={ROW}>
            <td className={`${TD} whitespace-nowrap text-muted`}>{stamp(r.createdAt)}</td>
            <td className={TD}>
              <span className="font-medium">{r.title}</span>{" "}
              <Pill tone="blue">{RECORD_LABEL[r.type]}</Pill>
            </td>
            <td className={TD}>{r.pet.name}</td>
            <td className={TD}>
              {r.vetName ?? "-"}
              {r.clinic ? `, ${r.clinic}` : ""}
            </td>
            <td className={TD}>
              {r._count.reports > 0 ? (
                <Pill tone="pink">{r._count.reports}</Pill>
              ) : (
                <span className="text-muted">0</span>
              )}
            </td>
            <td className={TD}>
              <Link href={`/admin/records/${r.id}`} className={REVIEW_LINK}>
                Open
              </Link>
            </td>
          </tr>
        ))}
        {records.length === 0 && <EmptyRow cols={6}>No vet-submitted records yet.</EmptyRow>}
      </tbody>
    </TableCard>
  );
}

async function Audit() {
  const entries = await prisma.auditEntry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <TableCard minWidth="64rem">
      <THead>
        <TH>When</TH>
        <TH>Action</TH>
        <TH>By</TH>
        <TH>Record</TH>
        <TH>Animal / owner</TH>
        <TH>Vet</TH>
        <TH>Reason</TH>
      </THead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.id} className={ROW}>
            <td className={`${TD} whitespace-nowrap text-muted`}>{stamp(e.createdAt)}</td>
            <td className={TD}>
              <Pill tone={e.action === "RECORD_VOIDED" ? "pink" : "gray"}>
                {e.action === "RECORD_VOIDED" ? "Voided record" : "Dismissed report"}
              </Pill>
            </td>
            <td className={TD}>
              {e.actorName}
              <span className="block text-[13px] text-muted">{e.actorEmail}</span>
            </td>
            <td className={TD}>
              <span className="font-medium">{e.recordTitle}</span>
              <span className="block text-[13px] text-muted">
                {RECORD_LABEL[e.recordType]}, {fmtFull(e.recordDate)}
              </span>
            </td>
            <td className={TD}>
              {e.petName}
              <span className="block text-[13px] text-muted">{e.ownerEmail}</span>
            </td>
            <td className={TD}>
              {e.vetName ?? "-"}
              {e.clinic ? `, ${e.clinic}` : ""}
            </td>
            <td className={`${TD} max-w-xs whitespace-pre-line`}>{e.reason}</td>
          </tr>
        ))}
        {entries.length === 0 && <EmptyRow cols={7}>Nothing in the audit trail yet.</EmptyRow>}
      </tbody>
    </TableCard>
  );
}
