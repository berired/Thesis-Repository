import Link from "next/link";
import { fmtFull, fmtTime } from "@/app/lib/time";
import { RECORD_LABEL } from "@/app/lib/care";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";

const VIEWS = [
  { id: "reports", label: "Reports" },
  { id: "records", label: "Vet records" },
  { id: "audit", label: "Audit trail" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const stamp = (d: Date) => `${fmtFull(d)}, ${fmtTime(d)}`;

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
      <h1 className="text-2xl font-semibold">Vet records</h1>
      <nav className="flex gap-2 text-sm">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/admin/records?view=${v.id}`}
            className={`rounded border px-3 py-1.5 ${v.id === view ? "bg-gray-900 text-white" : ""}`}
          >
            {v.label}
            {v.id === "reports" && openReports > 0 ? ` (${openReports})` : ""}
          </Link>
        ))}
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
    <table className="w-full text-left text-sm">
      <thead className="border-b">
        <tr>
          <th className="py-2">Reported</th>
          <th>Record</th>
          <th>Animal</th>
          <th>Vet</th>
          <th>Reporter</th>
          <th>Reason</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {reports.map((r) => (
          <tr key={r.id} className="border-b align-top">
            <td className="py-2">{stamp(r.createdAt)}</td>
            <td>
              {r.record.title}{" "}
              <span className="text-gray-600">({RECORD_LABEL[r.record.type]})</span>
            </td>
            <td>{r.record.pet.name}</td>
            <td>
              {r.record.vetName ?? "-"}
              {r.record.clinic ? `, ${r.record.clinic}` : ""}
            </td>
            <td>
              {r.reporter.name} ({r.reporter.email})
            </td>
            <td className="max-w-xs whitespace-pre-line">{r.reason}</td>
            <td>
              <Link href={`/admin/records/${r.record.id}`} className="underline">
                Review
              </Link>
            </td>
          </tr>
        ))}
        {reports.length === 0 && (
          <tr>
            <td colSpan={7} className="py-4 text-gray-600">
              No open reports.
            </td>
          </tr>
        )}
      </tbody>
    </table>
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
    <table className="w-full text-left text-sm">
      <thead className="border-b">
        <tr>
          <th className="py-2">Added</th>
          <th>Record</th>
          <th>Animal</th>
          <th>Vet</th>
          <th>Open reports</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id} className="border-b">
            <td className="py-2">{stamp(r.createdAt)}</td>
            <td>
              {r.title} <span className="text-gray-600">({RECORD_LABEL[r.type]})</span>
            </td>
            <td>{r.pet.name}</td>
            <td>
              {r.vetName ?? "-"}
              {r.clinic ? `, ${r.clinic}` : ""}
            </td>
            <td>{r._count.reports}</td>
            <td>
              <Link href={`/admin/records/${r.id}`} className="underline">
                Open
              </Link>
            </td>
          </tr>
        ))}
        {records.length === 0 && (
          <tr>
            <td colSpan={6} className="py-4 text-gray-600">
              No vet-submitted records yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

async function Audit() {
  const entries = await prisma.auditEntry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b">
        <tr>
          <th className="py-2">When</th>
          <th>Action</th>
          <th>By</th>
          <th>Record</th>
          <th>Animal / owner</th>
          <th>Vet</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.id} className="border-b align-top">
            <td className="py-2">{stamp(e.createdAt)}</td>
            <td>{e.action === "RECORD_VOIDED" ? "Voided record" : "Dismissed report"}</td>
            <td>
              {e.actorName} ({e.actorEmail})
            </td>
            <td>
              {e.recordTitle}{" "}
              <span className="text-gray-600">
                ({RECORD_LABEL[e.recordType]}, {fmtFull(e.recordDate)})
              </span>
            </td>
            <td>
              {e.petName} ({e.ownerEmail})
            </td>
            <td>
              {e.vetName ?? "-"}
              {e.clinic ? `, ${e.clinic}` : ""}
            </td>
            <td className="max-w-xs whitespace-pre-line">{e.reason}</td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr>
            <td colSpan={7} className="py-4 text-gray-600">
              Nothing in the audit trail yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
