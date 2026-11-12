import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import Icon, { type IconName } from "@/app/components/icon";
import { getOwnedPet } from "@/app/lib/pet-data";
import { RECORD_LABEL, fmtFull } from "@/app/lib/care";
import type { RecordType } from "@/app/generated/prisma/client";
import PetShell from "../pet-shell";
import YearSelect from "./year-select";

const FILTERS: { label: string; type?: RecordType; icon?: IconName }[] = [
  { label: "All" },
  { label: "Vaccines", type: "VACCINE", icon: "syringe" },
  { label: "Medication", type: "MEDICATION", icon: "pill" },
  { label: "Check-ups", type: "CHECKUP", icon: "stethoscope" },
  { label: "Lab", type: "LAB", icon: "flask-conical" },
];

export default async function RecordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; year?: string }>;
}) {
  const { id } = await params;
  const { type, year } = await searchParams;
  const pet = await getOwnedPet(id);

  const activeType = FILTERS.find((f) => f.type && f.type === type)?.type;
  const yearNumber = /^\d{4}$/.test(year ?? "") ? Number(year) : undefined;

  const [records, allDates] = await Promise.all([
    prisma.healthRecord.findMany({
      where: {
        petId: pet.id,
        ...(activeType ? { type: activeType } : {}),
        ...(yearNumber
          ? {
              recordDate: {
                gte: new Date(yearNumber, 0, 1),
                lt: new Date(yearNumber + 1, 0, 1),
              },
            }
          : {}),
      },
      orderBy: { recordDate: "desc" },
      include: { _count: { select: { files: true } } },
    }),
    prisma.healthRecord.findMany({
      where: { petId: pet.id },
      select: { recordDate: true },
    }),
  ]);

  const years = [...new Set(allDates.map((r) => r.recordDate.getFullYear()))].sort(
    (a, b) => b - a,
  );

  const href = (nextType?: string) => {
    const q = new URLSearchParams();
    if (nextType) q.set("type", nextType);
    if (yearNumber) q.set("year", String(yearNumber));
    const qs = q.toString();
    return `/pets/${pet.id}/records${qs ? `?${qs}` : ""}`;
  };

  return (
    <PetShell pet={pet} active="records" crumb="Health records">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const selected = filter.type === activeType;
          return (
            <Link
              key={filter.label}
              href={href(filter.type)}
              aria-current={selected ? "true" : undefined}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${
                selected
                  ? "border-sky bg-[#eef3fb] text-[#2a559e]"
                  : "border-transparent bg-[#ede4d0] text-ink hover:bg-[#e6dcc4]"
              }`}
            >
              {selected ? (
                <Icon name="check" size={14} />
              ) : filter.icon ? (
                <Icon name={filter.icon} size={14} />
              ) : null}
              {filter.label}
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          <YearSelect years={years} current={yearNumber} />
          <span
            aria-disabled="true"
            title="Coming soon"
            className="flex h-9 cursor-not-allowed select-none items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-[13px] font-semibold text-[#a0a7b0]"
          >
            <Icon name="download" size={15} />
            Export PDF
          </span>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8">
          <p className="text-[15px] text-muted">
            {pet._count.records === 0
              ? `No health records for ${pet.name} yet.`
              : "No records match these filters."}
          </p>
          <Link
            href={`/pets/${pet.id}/records/new`}
            className="text-sm font-semibold text-sky"
          >
            + Add a record
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f6f8fa] text-[13px] font-semibold text-muted">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Record</th>
                <th className="px-4 py-3 font-semibold">Clinic</th>
                <th className="px-4 py-3 text-right font-semibold">Files</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-line">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {fmtFull(record.recordDate)}
                  </td>
                  <td className="px-4 py-3.5">{RECORD_LABEL[record.type]}</td>
                  <td className="px-4 py-3.5">{record.title}</td>
                  <td className="px-4 py-3.5">{record.clinic ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right">
                    {record._count.files > 0 ? record._count.files : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PetShell>
  );
}
