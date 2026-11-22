import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import Icon, { type IconName } from "@/app/components/app-icon";
import YearSelect from "@/app/components/year-select";
import { StickerLink } from "@/app/components/ui";
import { RECORD_LABEL, fmtFull } from "@/app/lib/care";
import { accessiblePets } from "@/app/lib/pet-access";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import type { Prisma, RecordType } from "@/app/generated/prisma/client";

const FILTERS: { label: string; type?: RecordType; icon?: IconName }[] = [
  { label: "All" },
  { label: "Vaccines", type: "VACCINATION", icon: "syringe" },
  { label: "Medication", type: "MEDICATION", icon: "pill" },
  { label: "Check-ups", type: "VET_VISIT", icon: "stethoscope" },
  { label: "Lab", type: "LAB_RESULT", icon: "flask-conical" },
  { label: "Weight", type: "WEIGHT", icon: "weight" },
  { label: "Other", type: "OTHER", icon: "file-text" },
];

type Search = { pet?: string; type?: string; year?: string; q?: string };

export default async function AllRecordsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await requireUser();
  const { pet: petParam, type, year, q } = await searchParams;

  const pets = await prisma.pet.findMany({
    where: { ...accessiblePets(session.user.id), archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const activePet = pets.find((p) => p.id === petParam);
  const activeType = FILTERS.find((f) => f.type && f.type === type)?.type;
  const yearNumber = /^\d{4}$/.test(year ?? "") ? Number(year) : undefined;
  const search = (q ?? "").trim().slice(0, 80);

  // Everything is scoped to the pets this user can access, then narrowed by the filters.
  const scope: Prisma.HealthRecordWhereInput = {
    voidedAt: null,
    petId: { in: activePet ? [activePet.id] : pets.map((p) => p.id) },
  };
  const where: Prisma.HealthRecordWhereInput = {
    ...scope,
    ...(activeType ? { type: activeType } : {}),
    ...(yearNumber
      ? { recordDate: { gte: new Date(yearNumber, 0, 1), lt: new Date(yearNumber + 1, 0, 1) } }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { clinic: { contains: search, mode: "insensitive" } },
            { vetName: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [records, allDates, total] = await Promise.all([
    prisma.healthRecord.findMany({
      where,
      orderBy: { recordDate: "desc" },
      include: { pet: { select: { id: true, name: true } }, _count: { select: { files: true } } },
    }),
    prisma.healthRecord.findMany({ where: scope, select: { recordDate: true } }),
    prisma.healthRecord.count({ where: { voidedAt: null, petId: { in: pets.map((p) => p.id) } } }),
  ]);
  const years = [...new Set(allDates.map((r) => r.recordDate.getFullYear()))].sort((a, b) => b - a);

  const href = (next: Partial<Search>) => {
    const merged = { pet: activePet?.id, type: activeType, year: yearNumber?.toString(), q: search, ...next };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/records${qs ? `?${qs}` : ""}`;
  };
  const chip = (selected: boolean) =>
    `flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${
      selected
        ? "border-sky bg-[#eef3fb] text-[#2a559e]"
        : "border-transparent bg-[#ede4d0] text-ink hover:bg-[#e6dcc4]"
    }`;

  return (
    <OwnerPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[40px] leading-[44px] text-forest">Health records</h1>
          <p className="text-sm text-muted">
            {total} {total === 1 ? "record" : "records"} across {pets.length}{" "}
            {pets.length === 1 ? "animal" : "animals"}
          </p>
        </div>
        {pets.length > 0 ? (
          <StickerLink href={`/records/new${activePet ? `?pet=${activePet.id}` : ""}`} rotate={-3}>
            <Icon name="plus" size={18} />
            Add record
          </StickerLink>
        ) : null}
      </div>

      {pets.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8">
          <p className="text-[15px] text-muted">Add an animal to start keeping health records.</p>
          <Link href="/pets/new" className="text-sm font-semibold text-sky">
            + Add an animal
          </Link>
        </div>
      ) : (
        <>
          <form action="/records" method="get" className="flex max-w-[420px] gap-2">
            {activePet ? <input type="hidden" name="pet" value={activePet.id} /> : null}
            {activeType ? <input type="hidden" name="type" value={activeType} /> : null}
            {yearNumber ? <input type="hidden" name="year" value={yearNumber} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={search}
              aria-label="Search records"
              placeholder="Search records"
              className="h-9 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink placeholder:text-[#a0a7b0]"
            />
            <button type="submit" className="h-9 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:bg-[#f6f8fa]">
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={href({ pet: undefined })} className={chip(!activePet)}>
              All animals
            </Link>
            {pets.map((p) => (
              <Link key={p.id} href={href({ pet: p.id })} className={chip(activePet?.id === p.id)}>
                {p.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const selected = filter.type === activeType;
              return (
                <Link
                  key={filter.label}
                  href={href({ type: filter.type })}
                  aria-current={selected ? "true" : undefined}
                  className={chip(selected)}
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
            <div className="rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8 text-[15px] text-muted">
              {total === 0 ? "No health records yet." : "No records match these filters."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f6f8fa] text-[13px] font-semibold text-muted">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Animal</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Record</th>
                    <th className="px-4 py-3 font-semibold">Clinic</th>
                    <th className="px-4 py-3 text-right font-semibold">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-t border-line">
                      <td className="whitespace-nowrap px-4 py-3.5">{fmtFull(record.recordDate)}</td>
                      <td className="px-4 py-3.5">{record.pet.name}</td>
                      <td className="px-4 py-3.5">{RECORD_LABEL[record.type]}</td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/pets/${record.pet.id}/records/${record.id}`}
                          className="font-medium text-ink hover:underline"
                        >
                          {record.title}
                        </Link>
                        {record.source === "VET" ? (
                          <span className="ml-2 rounded-md bg-[#e6eefb] px-1.5 py-0.5 text-[11px] font-semibold text-[#2a559e]">
                            Vet-submitted
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">{record.clinic ?? record.vetName ?? "—"}</td>
                      <td className="px-4 py-3.5 text-right">
                        {record._count.files > 0 ? record._count.files : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </OwnerPage>
  );
}
